import { NextResponse, type NextRequest } from 'next/server';
import { createClient, isConfigured } from '@/lib/supabase/server';
export async function GET(request: NextRequest) {
  const token_hash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type');
  if (
    token_hash &&
    (type === 'signup' || type === 'recovery' || type === 'email') &&
    isConfigured()
  ) {
    const db = await createClient();
    const { error } = await db.auth.verifyOtp({ token_hash, type });
    if (!error)
      return NextResponse.redirect(
        new URL(type === 'recovery' ? '/settings' : '/dashboard', request.url),
      );
  }
  return NextResponse.redirect(new URL('/login?error=confirmation', request.url));
}
