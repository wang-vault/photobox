import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export function isConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
export async function createClient() {
  if (!isConfigured()) throw new Error('Konfigurasi Supabase belum tersedia.');
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(values) {
          try {
            values.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            /* Server Components are read-only; proxy refreshes the session. */
          }
        },
      },
    },
  );
}
