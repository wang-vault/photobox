import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient, isConfigured } from './supabase/server';
import type { Workspace } from './types';
export const getWorkspace = cache(async (): Promise<Workspace> => {
  if (!isConfigured()) redirect('/login');
  const db = await createClient();
  const {
    data: { user },
    error: authError,
  } = await db.auth.getUser();
  if (authError || !user) redirect('/login');
  // One RPC = one PostgreSQL snapshot, preventing mixed revisions across tables.
  const { data, error } = await db.rpc('get_workspace');
  if (error) {
    console.error('Workspace fetch:', error.code, error.message);
    throw new Error(
      'Data tidak dapat dimuat. Periksa koneksi dan pastikan migration Supabase sudah dijalankan.',
    );
  }
  if (!data?.profile || data.profile.role !== 'OWNER')
    throw new Error('Profil Owner tidak tersedia. Hubungi administrator Supabase.');
  return { ...data, email: user.email ?? '' } as Workspace;
});
