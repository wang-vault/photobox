import { NextResponse, type NextRequest } from 'next/server';
import { createClient, isConfigured } from '@/lib/supabase/server';
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (code && isConfigured()) {
    const db = await createClient();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(
          request.nextUrl.searchParams.get('next') === '/settings' ? '/settings' : '/dashboard',
          request.url,
        ),
      );
  }
  return NextResponse.redirect(new URL('/login?error=confirmation', request.url));
}
