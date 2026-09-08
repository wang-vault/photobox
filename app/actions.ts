'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';
import { createClient, isConfigured } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/types';
const uuid = z.uuid();
const score = z.number().int().min(1).max(5);
async function mutate(name: string, params: Record<string, unknown>): Promise<ActionResult> {
  if (!isConfigured()) return { error: 'Konfigurasikan Supabase terlebih dahulu.' };
  const db = await createClient();
  const {
    data: { user },
    error: authError,
  } = await db.auth.getUser();
  if (authError || !user) return { error: 'Sesi berakhir. Silakan login kembali.' };
  const { data, error } = await db.rpc(name, params);
  if (error) {
    console.error('Mutation:', name, error.code, error.message);
    return {
      error:
        error.code === 'P0001'
          ? error.message
          : 'Data gagal disimpan. Periksa isian, koneksi, dan konfigurasi database.',
    };
  }
  revalidatePath('/', 'layout');
  return {
    success: 'Perubahan berhasil disimpan.',
    id: typeof data === 'string' ? data : undefined,
  };
}
export async function saveQuestionnaire(
  scores: Record<string, number>,
  id?: string,
  updatedAt?: string,
): Promise<ActionResult> {
  if (
    !z
      .record(z.string().regex(/^(10|[1-9])$/), score)
      .refine((x) => Object.keys(x).length === 10)
      .safeParse(scores).success ||
    (id && !uuid.safeParse(id).success)
  )
    return { error: 'Isi seluruh 10 variabel dengan nilai 1–5.' };
  return mutate('save_questionnaire', {
    p_scores: scores,
    p_id: id ?? null,
    p_updated_at: updatedAt ?? null,
  });
}
export async function confirmTopVariables(ids: string[]): Promise<ActionResult> {
  if (!z.array(uuid).length(5).safeParse(ids).success) return { error: 'TOP 5 belum lengkap.' };
  return mutate('confirm_top_variables', { p_analysis_ids: ids });
}
export async function savePhotoBox(form: FormData): Promise<ActionResult> {
  const data = {
    name: form.get('name'),
    location: form.get('location'),
    price: form.get('price'),
    description: form.get('description'),
    notes: form.get('notes'),
  };
  const parsed = z
    .object({
      name: z.string().trim().min(1).max(120),
      location: z.string().trim().min(1).max(250),
      price: z.string().regex(/^\d{1,12}(\.\d{1,2})?$/),
      description: z.string().max(2000),
      notes: z.string().max(2000),
    })
    .safeParse(data);
  const id = form.get('id');
  if (!parsed.success || (id && !uuid.safeParse(id).success))
    return { error: 'Periksa nama, lokasi, harga, dan panjang deskripsi kandidat.' };
  return mutate('save_photobox', {
    p_data: parsed.data,
    p_id: id || null,
    p_updated_at: form.get('updated_at') || null,
  });
}
export async function saveAssessment(
  id: string,
  scores: Record<string, number>,
  updatedAt: string,
): Promise<ActionResult> {
  if (
    !uuid.safeParse(id).success ||
    !z
      .record(uuid, score)
      .refine((x) => Object.keys(x).length === 5)
      .safeParse(scores).success
  )
    return { error: 'Isi seluruh lima nilai assessment.' };
  return mutate('save_assessment', {
    p_photobox_id: id,
    p_scores: scores,
    p_photobox_updated_at: updatedAt,
  });
}
export async function deleteRecord(
  kind: 'questionnaire' | 'photobox',
  id: string,
): Promise<ActionResult> {
  if (!uuid.safeParse(id).success || !['questionnaire', 'photobox'].includes(kind))
    return { error: 'Data tidak valid.' };
  return mutate('delete_record', { p_kind: kind, p_id: id });
}
export async function updateProfile(form: FormData): Promise<ActionResult> {
  const name = z.string().trim().min(1).max(100).safeParse(form.get('full_name'));
  if (!name.success) return { error: 'Nama harus 1–100 karakter.' };
  return mutate('update_owner', { p_full_name: name.data });
}
export async function updatePassword(form: FormData): Promise<ActionResult> {
  const password = z.string().min(8).max(128).safeParse(form.get('password'));
  if (!password.success || form.get('confirm_password') !== password.data)
    return { error: 'Password minimal 8 karakter dan konfirmasi harus sama.' };
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { error: 'Silakan login kembali.' };
  const { error } = await db.auth.updateUser({ password: password.data });
  return error
    ? { error: 'Password gagal diperbarui. Gunakan password baru atau login ulang.' }
    : { success: 'Password berhasil diperbarui.' };
}
export async function authenticate(
  mode: 'login' | 'register' | 'reset',
  form: FormData,
): Promise<ActionResult> {
  if (!isConfigured())
    return { error: 'Supabase belum terhubung. Ikuti panduan konfigurasi di README.' };
  const email = z
    .email()
    .max(254)
    .safeParse(String(form.get('email') ?? '').trim());
  if (!email.success) return { error: 'Masukkan alamat email yang valid.' };
  const db = await createClient();
  const origin = (await headers()).get('origin');
  if (mode === 'reset') {
    const { error } = await db.auth.resetPasswordForEmail(email.data, {
      redirectTo: `${origin}/auth/callback?next=/settings`,
    });
    return error
      ? { error: 'Permintaan belum dapat diproses. Coba lagi beberapa saat.' }
      : {
          success:
            'Jika email terdaftar, tautan pemulihan akan dikirim. Periksa inbox dan folder spam.',
        };
  }
  const password = z.string().min(8).max(128).safeParse(form.get('password'));
  if (!password.success) return { error: 'Password harus terdiri dari 8–128 karakter.' };
  if (mode === 'register') {
    const name = z.string().trim().min(1).max(100).safeParse(form.get('full_name'));
    if (!name.success) return { error: 'Nama Owner wajib diisi, maksimal 100 karakter.' };
    const { data, error } = await db.auth.signUp({
      email: email.data,
      password: password.data,
      options: { data: { full_name: name.data }, emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error)
      return { error: 'Registrasi belum berhasil. Periksa isian atau coba kembali beberapa saat.' };
    if (!data.session)
      return {
        success:
          'Periksa email Anda untuk konfirmasi akun. Jika sudah terdaftar, silakan masuk atau pulihkan password.',
      };
  } else if (mode === 'login') {
    const { error } = await db.auth.signInWithPassword({
      email: email.data,
      password: password.data,
    });
    if (error) return { error: 'Login gagal. Periksa email, password, dan konfirmasi email Anda.' };
  } else return { error: 'Permintaan tidak valid.' };
  redirect('/dashboard');
}
export async function signOut() {
  const db = await createClient();
  const { error } = await db.auth.signOut();
  if (error) throw new Error('Gagal keluar. Coba lagi.');
  redirect('/login');
}
