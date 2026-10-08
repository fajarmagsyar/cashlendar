import { NextResponse, type NextRequest } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { safeNextPath,callbackOrigin } from '@/lib/supabase/redirects';
export async function GET(request: NextRequest) {
  const origin=callbackOrigin(request.url,{production:process.env.NODE_ENV==='production',appUrl:process.env.NEXT_PUBLIC_APP_URL,vercel:process.env.VERCEL==='1',forwardedHost:request.headers.get('x-forwarded-host')});
  const code = request.nextUrl.searchParams.get('code');
  const next = safeNextPath(request.nextUrl.searchParams.get('next'));
  if (code) {
    try {
      const supabase = await getServerSupabase();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const response = NextResponse.redirect(new URL(next, origin));
        response.headers.set('Cache-Control','private, no-store');
        return response;
      }
    } catch { /* Return an actionable login error if callback configuration is incomplete. */ }
  }
  return NextResponse.redirect(new URL(`/login?error=callback&next=${encodeURIComponent(next)}`, origin));
}
