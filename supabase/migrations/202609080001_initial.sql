-- PhotoBox Ranking System. Schema only: no seed, sample, or research data.
-- Run once in the Supabase SQL editor (or via supabase db push).
begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 100),
  role text not null default 'OWNER' check (role = 'OWNER'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.variables (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  code smallint not null check (code between 1 and 10), name text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(owner_id, code), unique(id, owner_id)
);
create table public.questionnaire_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(id, owner_id)
);
create table public.questionnaire_scores (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  entry_id uuid not null, variable_id uuid not null, value smallint not null check(value between 1 and 5),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(entry_id, owner_id) references public.questionnaire_entries(id, owner_id) on delete cascade,
  foreign key(variable_id, owner_id) references public.variables(id, owner_id) on delete cascade,
  unique(entry_id, variable_id)
);
create table public.variable_analysis (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  variable_id uuid not null, total bigint not null check(total > 0), count bigint not null check(count > 0),
  mean numeric not null check(mean between 1 and 5), position smallint not null check(position between 1 and 10),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(variable_id, owner_id) references public.variables(id, owner_id) on delete cascade,
  unique(owner_id, variable_id), unique(owner_id, position)
);
create table public.selected_top_variables (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  variable_id uuid not null, mean numeric not null check(mean between 1 and 5),
  weight numeric not null check(weight > 0 and weight < 1), position smallint not null check(position between 1 and 5),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(variable_id, owner_id) references public.variables(id, owner_id) on delete cascade,
  unique(owner_id, variable_id), unique(owner_id, position), unique(id, owner_id)
);
create table public.photoboxes (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check(char_length(btrim(name)) between 1 and 120),
  location text not null check(char_length(btrim(location)) between 1 and 250),
  price numeric(14,2) not null check(price >= 0),
  description text check(char_length(description) <= 2000), notes text check(char_length(notes) <= 2000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(id, owner_id)
);
create table public.photobox_assessments (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  photobox_id uuid not null, selected_variable_id uuid not null, value smallint not null check(value between 1 and 5),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(photobox_id, owner_id) references public.photoboxes(id, owner_id) on delete cascade,
  foreign key(selected_variable_id, owner_id) references public.selected_top_variables(id, owner_id) on delete cascade,
  unique(photobox_id, selected_variable_id)
);
create table public.ranking_results (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  photobox_id uuid not null, score numeric not null check(score between 1 and 5),
  position integer not null check(position > 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(photobox_id, owner_id) references public.photoboxes(id, owner_id) on delete cascade,
  unique(owner_id, photobox_id), unique(owner_id, position)
);

create function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := clock_timestamp(); return new; end;
$$;
create function public.handle_new_owner() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name) values(new.id, left(coalesce(nullif(btrim(new.raw_user_meta_data->>'full_name'), ''), 'Owner'), 100));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_owner();

-- Read-only table access for authenticated clients. ALL writes go through atomic RPCs.
do $$ declare t text; begin
  foreach t in array array['profiles','variables','questionnaire_entries','questionnaire_scores','variable_analysis','selected_top_variables','photoboxes','photobox_assessments','ranking_results'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select on table public.%I to authenticated', t);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t);
    if t = 'profiles' then
      execute format('create policy own_read on public.%I for select to authenticated using ((select auth.uid()) = id)', t);
    else
      execute format('create policy own_read on public.%I for select to authenticated using ((select auth.uid()) = owner_id)', t);
      execute format('create index on public.%I(owner_id)', t);
    end if;
  end loop;
end $$;

-- Serializes writes for one Owner; clients cannot supply an owner_id.
create function public.lock_owner() returns uuid language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null or not exists(select 1 from public.profiles where id = u and role = 'OWNER') then raise exception 'Akses Owner diperlukan.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text, 0));
  return u;
end;
$$;

-- The ten fixed questionnaire definitions are created ONLY during the first real submission.
-- They are instrument metadata, never research values. Migration leaves this table empty.
create function public.ensure_variables(u uuid) returns void language sql security definer set search_path = '' as $$
  insert into public.variables(owner_id, code, name)
  select u, ordinality, name from unnest(array[
    'Kualitas Hasil Foto', 'Harga atau Kesesuaian Harga', 'Variasi Frame atau Template',
    'Kualitas Properti dan Aksesoris', 'Kemudahan Penggunaan', 'Kecepatan Proses Pengambilan Foto',
    'Lokasi dan Aksesibilitas', 'Pelayanan', 'Kualitas Cetakan Foto', 'Fasilitas dan Kenyamanan Area Photo Box'
  ]) with ordinality as definitions(name, ordinality)
  on conflict(owner_id, code) do nothing;
$$;

create function public.refresh_analysis(u uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  -- Any research revision invalidates the confirmed snapshot and cascades assessments.
  delete from public.ranking_results where owner_id = u;
  delete from public.selected_top_variables where owner_id = u;
  delete from public.variable_analysis where owner_id = u;
  if not exists(select 1 from public.questionnaire_entries where owner_id = u) then return; end if;
  insert into public.variable_analysis(owner_id, variable_id, total, count, mean, position)
  select u, v.id, sum(s.value), count(*), avg(s.value),
    row_number() over(order by avg(s.value) desc, v.code asc)
  from public.questionnaire_scores s join public.variables v on v.id = s.variable_id
  where s.owner_id = u group by v.id, v.code;
end;
$$;

create function public.refresh_ranking(u uuid) returns void language plpgsql security definer set search_path = '' as $$
declare n bigint;
begin
  delete from public.ranking_results where owner_id = u;
  select count(*) into n from public.photoboxes where owner_id = u;
  if n = 0 or (select count(*) from public.selected_top_variables where owner_id = u) <> 5
    or not exists(select 1 from public.questionnaire_entries where owner_id = u) then return; end if;
  if exists(select 1 from public.photoboxes p where p.owner_id = u and
    (select count(*) from public.photobox_assessments a where a.photobox_id = p.id and a.owner_id = u) <> 5) then return; end if;
  insert into public.ranking_results(owner_id, photobox_id, score, position)
  select u, p.id, sum(a.value * s.weight),
    row_number() over(order by sum(a.value * s.weight) desc, p.created_at asc, p.id asc)
  from public.photoboxes p join public.photobox_assessments a on a.photobox_id = p.id
  join public.selected_top_variables s on s.id = a.selected_variable_id
  where p.owner_id = u group by p.id, p.created_at;
end;
$$;

create function public.save_questionnaire(p_scores jsonb, p_id uuid default null, p_updated_at timestamptz default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare u uuid := public.lock_owner(); eid uuid; k text; val jsonb;
begin
  if p_scores is null or jsonb_typeof(p_scores) <> 'object' then raise exception 'Sepuluh nilai wajib diisi.'; end if;
  if (select count(*) from jsonb_object_keys(p_scores)) <> 10 then raise exception 'Sepuluh nilai wajib diisi.'; end if;
  for k, val in select * from jsonb_each(p_scores) loop
    if k !~ '^(10|[1-9])$' or jsonb_typeof(val) <> 'number' or val::text !~ '^[1-5]$' then raise exception 'Nilai harus bilangan bulat 1–5 untuk seluruh 10 variabel.'; end if;
  end loop;
  perform public.ensure_variables(u);
  if p_id is null then
    insert into public.questionnaire_entries(owner_id) values(u) returning id into eid;
  else
    update public.questionnaire_entries set updated_at = clock_timestamp()
    where id = p_id and owner_id = u and updated_at = p_updated_at returning id into eid;
    if eid is null then raise exception 'Data sudah berubah atau tidak ditemukan. Muat ulang halaman.'; end if;
    delete from public.questionnaire_scores where entry_id = eid and owner_id = u;
  end if;
  insert into public.questionnaire_scores(owner_id, entry_id, variable_id, value)
  select u, eid, id, (p_scores->>code::text)::smallint from public.variables where owner_id = u;
  perform public.refresh_analysis(u);
  return eid;
end;
$$;

create function public.confirm_top_variables(p_analysis_ids uuid[]) returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := public.lock_owner(); s numeric; running numeric := 0; w numeric; r record;
begin
  if (select count(*) from public.variable_analysis where owner_id = u) <> 10 then raise exception 'Isi kuesioner terlebih dahulu.'; end if;
  if p_analysis_ids is null or cardinality(p_analysis_ids) <> 5 or
    (select count(*) from public.variable_analysis where owner_id = u and position <= 5 and id = any(p_analysis_ids)) <> 5 then
    raise exception 'Analisis telah berubah. Muat ulang sebelum konfirmasi.';
  end if;
  if (select count(*) from public.selected_top_variables where owner_id = u) = 5 then return; end if;
  delete from public.ranking_results where owner_id = u;
  delete from public.selected_top_variables where owner_id = u;
  select sum(mean) into s from public.variable_analysis where owner_id = u and position <= 5;
  for r in select * from public.variable_analysis where owner_id = u and position <= 5 order by position loop
    -- Residual on the fifth weight makes the stored numeric sum exactly one.
    w := case when r.position = 5 then 1 - running else r.mean / s end;
    insert into public.selected_top_variables(owner_id, variable_id, mean, weight, position) values(u, r.variable_id, r.mean, w, r.position);
    running := running + w;
  end loop;
end;
$$;

create function public.save_photobox(p_data jsonb, p_id uuid default null, p_updated_at timestamptz default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare u uuid := public.lock_owner(); pid uuid; cost numeric;
begin
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'Data kandidat tidak valid.'; end if;
  if coalesce(char_length(btrim(p_data->>'name')),0) not between 1 and 120 or
    coalesce(char_length(btrim(p_data->>'location')),0) not between 1 and 250 then raise exception 'Nama dan lokasi wajib diisi sesuai batas panjang.'; end if;
  if coalesce(p_data->>'price','') !~ '^\d{1,12}(\.\d{1,2})?$' then raise exception 'Harga wajib berupa angka positif atau nol, maksimal dua desimal.'; end if;
  cost := (p_data->>'price')::numeric;
  if p_id is null then
    insert into public.photoboxes(owner_id, name, location, price, description, notes)
    values(u, btrim(p_data->>'name'), btrim(p_data->>'location'), cost, nullif(btrim(p_data->>'description'),''), nullif(btrim(p_data->>'notes'),'')) returning id into pid;
  else
    update public.photoboxes set name = btrim(p_data->>'name'), location = btrim(p_data->>'location'), price = cost,
      description = nullif(btrim(p_data->>'description'),''), notes = nullif(btrim(p_data->>'notes'),'')
    where id = p_id and owner_id = u and updated_at = p_updated_at returning id into pid;
    if pid is null then raise exception 'Kandidat telah berubah atau tidak ditemukan. Muat ulang halaman.'; end if;
    -- Editing candidate facts can change the assessment. Require a fresh manual assessment.
    delete from public.photobox_assessments where photobox_id = pid and owner_id = u;
  end if;
  perform public.refresh_ranking(u);
  return pid;
end;
$$;

create function public.save_assessment(p_photobox_id uuid, p_scores jsonb, p_photobox_updated_at timestamptz)
returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := public.lock_owner(); k text; val jsonb;
begin
  if not exists(select 1 from public.questionnaire_entries where owner_id = u)
    or (select count(*) from public.selected_top_variables where owner_id = u) <> 5 then raise exception 'Konfirmasi TOP 5 terlebih dahulu.'; end if;
  if not exists(select 1 from public.photoboxes where id = p_photobox_id and owner_id = u and updated_at = p_photobox_updated_at) then raise exception 'Kandidat berubah atau tidak ditemukan. Muat ulang halaman.'; end if;
  if p_scores is null or jsonb_typeof(p_scores) <> 'object' then raise exception 'Kelima nilai wajib diisi.'; end if;
  if (select count(*) from jsonb_object_keys(p_scores)) <> 5 then raise exception 'Kelima nilai wajib diisi.'; end if;
  for k, val in select * from jsonb_each(p_scores) loop
    if jsonb_typeof(val) <> 'number' or val::text !~ '^[1-5]$' then raise exception 'Nilai assessment harus bilangan bulat 1–5.'; end if;
    if not exists(select 1 from public.selected_top_variables where id::text = k and owner_id = u) then raise exception 'TOP 5 telah berubah. Muat ulang halaman.'; end if;
  end loop;
  insert into public.photobox_assessments(owner_id, photobox_id, selected_variable_id, value)
  select u, p_photobox_id, key::uuid, value::text::smallint from jsonb_each(p_scores)
  on conflict(photobox_id, selected_variable_id) do update set value = excluded.value;
  perform public.refresh_ranking(u);
end;
$$;

create function public.delete_record(p_kind text, p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := public.lock_owner(); removed uuid;
begin
  if p_kind = 'questionnaire' then
    delete from public.questionnaire_entries where id = p_id and owner_id = u returning id into removed;
    if removed is null then raise exception 'Data tidak ditemukan.'; end if;
    perform public.refresh_analysis(u);
  elsif p_kind = 'photobox' then
    delete from public.photoboxes where id = p_id and owner_id = u returning id into removed;
    if removed is null then raise exception 'Kandidat tidak ditemukan.'; end if;
    perform public.refresh_ranking(u);
  else raise exception 'Jenis data tidak valid.';
  end if;
end;
$$;

create function public.update_owner(p_full_name text) returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := public.lock_owner();
begin
  if p_full_name is null or char_length(btrim(p_full_name)) not between 1 and 100 then raise exception 'Nama harus 1–100 karakter.'; end if;
  update public.profiles set full_name = btrim(p_full_name) where id = u;
end;
$$;

-- A consistent database snapshot for every screen. Never treats database errors as no data.
create function public.get_workspace() returns jsonb language sql stable security invoker set search_path = '' as $$
select jsonb_build_object(
  'profile', (select to_jsonb(p) from public.profiles p where id = auth.uid()),
  'variables', coalesce((select jsonb_agg(v order by v.code) from public.variables v where owner_id = auth.uid()), '[]'::jsonb),
  'entries', coalesce((select jsonb_agg(e order by e.created_at desc) from (
    select q.*, coalesce((select jsonb_agg(s) from public.questionnaire_scores s where s.entry_id = q.id), '[]'::jsonb) questionnaire_scores
    from public.questionnaire_entries q where owner_id = auth.uid()
  ) e), '[]'::jsonb),
  'analysis', coalesce((select jsonb_agg(a order by a.position) from public.variable_analysis a where owner_id = auth.uid()), '[]'::jsonb),
  'selected', coalesce((select jsonb_agg(s order by s.position) from public.selected_top_variables s where owner_id = auth.uid()), '[]'::jsonb),
  'photoboxes', coalesce((select jsonb_agg(p order by p.created_at, p.id) from public.photoboxes p where owner_id = auth.uid()), '[]'::jsonb),
  'assessments', coalesce((select jsonb_agg(a) from public.photobox_assessments a where owner_id = auth.uid()), '[]'::jsonb),
  'rankings', coalesce((select jsonb_agg(r order by r.position) from public.ranking_results r where owner_id = auth.uid()), '[]'::jsonb),
  'has_top_tie', (select count(*) > 1 from public.ranking_results r where owner_id = auth.uid()
    and score = (select max(score) from public.ranking_results where owner_id = auth.uid()))
);
$$;

-- No helper function can be called from PostgREST, including by authenticated owners.
revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_owner() from public, anon, authenticated;
revoke all on function public.lock_owner() from public, anon, authenticated;
revoke all on function public.ensure_variables(uuid) from public, anon, authenticated;
revoke all on function public.refresh_analysis(uuid) from public, anon, authenticated;
revoke all on function public.refresh_ranking(uuid) from public, anon, authenticated;
revoke all on function public.save_questionnaire(jsonb, uuid, timestamptz) from public, anon;
revoke all on function public.confirm_top_variables(uuid[]) from public, anon;
revoke all on function public.save_photobox(jsonb, uuid, timestamptz) from public, anon;
revoke all on function public.save_assessment(uuid, jsonb, timestamptz) from public, anon;
revoke all on function public.delete_record(text, uuid) from public, anon;
revoke all on function public.update_owner(text) from public, anon;
revoke all on function public.get_workspace() from public, anon;
grant execute on function public.save_questionnaire(jsonb, uuid, timestamptz), public.confirm_top_variables(uuid[]),
  public.save_photobox(jsonb, uuid, timestamptz), public.save_assessment(uuid, jsonb, timestamptz),
  public.delete_record(text, uuid), public.update_owner(text), public.get_workspace() to authenticated;
commit;
