import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// PostgreSQL engine, not an API mock. Empty schema only; no users, candidates,
// scores, questionnaire entries, or other research fixtures are inserted.
const db = new PGlite();
const tables = [
  'profiles',
  'variables',
  'questionnaire_entries',
  'questionnaire_scores',
  'variable_analysis',
  'selected_top_variables',
  'photoboxes',
  'photobox_assessments',
  'ranking_results',
];
before(async () => {
  // Empty Supabase auth contract needed by the standalone PostgreSQL engine.
  // This defines infrastructure, not research records or a mock response.
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    grant usage on schema auth to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
  `);
  await db.exec(
    await readFile(
      new URL('../supabase/migrations/202609080001_initial.sql', import.meta.url),
      'utf8',
    ),
  );
});
after(async () => {
  await db.close();
});

test('migration creates nine empty application tables with UUID ids and timestamps', async () => {
  for (const table of tables) {
    const result = await db.query<{ count: number }>(
      `select count(*)::integer count from public.${table}`,
    );
    assert.equal(result.rows[0].count, 0, `${table} must start empty`);
    const columns = await db.query<{ column_name: string; data_type: string }>(
      `select column_name, data_type from information_schema.columns where table_schema='public' and table_name=$1`,
      [table],
    );
    assert.equal(columns.rows.find((c) => c.column_name === 'id')?.data_type, 'uuid');
    assert.ok(columns.rows.some((c) => c.column_name === 'created_at'));
    assert.ok(columns.rows.some((c) => c.column_name === 'updated_at'));
  }
});

test('every application table has RLS and a single owner-scoped SELECT policy', async () => {
  for (const table of tables) {
    const rls = await db.query<{ enabled: boolean }>(
      `select relrowsecurity enabled from pg_class where oid=$1::regclass`,
      [`public.${table}`],
    );
    assert.equal(rls.rows[0].enabled, true);
    const policies = await db.query<{ cmd: string; qual: string }>(
      `select cmd, qual from pg_policies where schemaname='public' and tablename=$1`,
      [table],
    );
    assert.equal(policies.rows.length, 1);
    assert.equal(policies.rows[0].cmd, 'SELECT');
    assert.match(policies.rows[0].qual, /auth.uid/);
  }
});

test('clients cannot bypass transactional validation through direct table writes', async () => {
  for (const table of tables) {
    for (const role of ['anon', 'authenticated']) {
      for (const privilege of ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) {
        const result = await db.query<{ allowed: boolean }>(
          'select has_table_privilege($1, $2, $3) allowed',
          [role, `public.${table}`, privilege],
        );
        assert.equal(result.rows[0].allowed, false, `${role} ${privilege} ${table}`);
      }
    }
  }
});

test('helper functions are not executable by API roles', async () => {
  const helpers = [
    'lock_owner()',
    'ensure_variables(uuid)',
    'refresh_analysis(uuid)',
    'refresh_ranking(uuid)',
    'handle_new_owner()',
    'touch_updated_at()',
  ];
  for (const helper of helpers) {
    for (const role of ['anon', 'authenticated']) {
      const result = await db.query<{ allowed: boolean }>(
        'select has_function_privilege($1, $2, $3) allowed',
        [role, `public.${helper}`, 'EXECUTE'],
      );
      assert.equal(result.rows[0].allowed, false, `${role} must not invoke ${helper}`);
    }
  }
});

test('public mutation RPCs require authenticated access', async () => {
  const functions = [
    'save_questionnaire(jsonb,uuid,timestamptz)',
    'confirm_top_variables(uuid[])',
    'save_photobox(jsonb,uuid,timestamptz)',
    'save_assessment(uuid,jsonb,timestamptz)',
    'delete_record(text,uuid)',
    'update_owner(text)',
    'get_workspace()',
  ];
  for (const fn of functions) {
    for (const role of ['anon', 'authenticated']) {
      const result = await db.query<{ allowed: boolean }>(
        'select has_function_privilege($1, $2, $3) allowed',
        [role, `public.${fn}`, 'EXECUTE'],
      );
      assert.equal(result.rows[0].allowed, role === 'authenticated');
    }
  }
});

test('no session cannot mutate any research data', async () => {
  await assert.rejects(
    db.query(`select public.save_questionnaire('{}'::jsonb)`),
    /Akses Owner diperlukan/,
  );
  await assert.rejects(
    db.query(`select public.confirm_top_variables('{}'::uuid[])`),
    /Akses Owner diperlukan/,
  );
  await assert.rejects(
    db.query(`select public.save_photobox('{}'::jsonb)`),
    /Akses Owner diperlukan/,
  );
  await assert.rejects(
    db.query(`select public.delete_record('questionnaire', null)`),
    /Akses Owner diperlukan/,
  );
});

test('empty workspace returns no invented statistics, assessments, or rankings', async () => {
  await db.exec('set role authenticated');
  const result = await db.query<{ data: Record<string, unknown> }>(
    'select public.get_workspace() data',
  );
  assert.equal(result.rows[0].data.profile, null);
  for (const key of [
    'variables',
    'entries',
    'analysis',
    'selected',
    'photoboxes',
    'assessments',
    'rankings',
  ])
    assert.deepEqual(result.rows[0].data[key], []);
  await db.exec('reset role');
});

test('score constraints and cross-owner composite foreign keys exist', async () => {
  for (const table of ['questionnaire_scores', 'photobox_assessments']) {
    const checks = await db.query<{ definition: string }>(
      `select pg_get_constraintdef(oid) definition from pg_constraint where conrelid=$1::regclass and contype='c'`,
      [`public.${table}`],
    );
    assert.ok(
      checks.rows.some((c) => /value >= 1/.test(c.definition) && /value <= 5/.test(c.definition)),
    );
    const fks = await db.query<{ definition: string }>(
      `select pg_get_constraintdef(oid) definition from pg_constraint where conrelid=$1::regclass and contype='f'`,
      [`public.${table}`],
    );
    assert.equal(fks.rows.filter((c) => /, owner_id\)/.test(c.definition)).length, 2);
  }
});

test('canonical questionnaire metadata matches the SQL instrument definitions', async () => {
  const { VARIABLES } = await import('../lib/constants');
  const sql = await readFile(
    new URL('../supabase/migrations/202609080001_initial.sql', import.meta.url),
    'utf8',
  );
  assert.equal(VARIABLES.length, 10);
  assert.equal(new Set(VARIABLES).size, 10);
  for (const variable of VARIABLES) assert.ok(sql.includes(`'${variable}'`));
});
