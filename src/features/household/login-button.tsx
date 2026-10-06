'use client';
import { useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';
export function LoginButton({ next }: { next:string }) {
  const [pending,setPending] = useState(false), [error,setError] = useState('');
  async function login() {
    setPending(true); setError('');
    try {
      const supabase = getBrowserSupabase();
      const callback = new URL('/auth/callback',window.location.origin); callback.searchParams.set('next',next);
      const { error } = await supabase.auth.signInWithOAuth({ provider:'google',options:{ redirectTo:callback.toString(),queryParams:{prompt:'select_account'} } });
      if (error) throw error;
    } catch { setError('Could not start Google sign-in. Check your connection and try again.'); setPending(false); }
  }
  return <><button className="button google-button" onClick={login} disabled={pending}><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.8 12.2c0-.7-.1-1.4-.2-2.2H12v4h5.5a4.7 4.7 0 0 1-2 3.1A6 6 0 1 1 18 8l2.9-2.9A10 10 0 1 0 12 22c5.8 0 9.8-4.1 9.8-9.8Z"/></svg>{pending ? 'Opening Google…' : 'Continue with Google'}</button>{error && <p className="error-text" role="alert">{error}</p>}</>;
}
