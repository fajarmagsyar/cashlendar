import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseConfig } from './lib/supabase/config';
export async function proxy(request: NextRequest) {
  const config = supabaseConfig();
  if (!config) return NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: values => {
      values.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    }
  } });
  try { await supabase.auth.getClaims(); } catch { /* Protected routes verify the session independently and show login. */ }
  response.headers.set('Cache-Control','private, no-store, max-age=0');
  return response;
}
export const config = { matcher: ['/((?!_next/|icons/|sw.js|offline.html|manifest.webmanifest|favicon.ico).*)'] };
