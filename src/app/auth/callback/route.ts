import { NextResponse, type NextRequest } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/supabase/redirects';
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = safeNextPath(request.nextUrl.searchParams.get('next'));
  if (code) {
    try {
      const supabase = await getServerSupabase();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const response = NextResponse.redirect(new URL(next, request.url));
        response.headers.set('Cache-Control','private, no-store');
        return response;
      }
    } catch { /* Return an actionable login error if callback configuration is incomplete. */ }
  }
  return NextResponse.redirect(new URL(`/login?error=callback&next=${encodeURIComponent(next)}`, request.url));
}
