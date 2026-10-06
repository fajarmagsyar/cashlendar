import { supabaseConfig } from '@/lib/supabase/config';
import { safeNextPath } from '@/lib/supabase/redirects';
import { LoginButton } from '@/features/household/login-button';
import { Icon } from '@/components/icon';
export const dynamic = 'force-dynamic';
export default async function Login({ searchParams }: { searchParams:Promise<Record<string,string|undefined>> }) {
  const params = await searchParams;
  const configured = Boolean(supabaseConfig());
  return <div className="login-layout"><section className="login-story"><div className="brand"><span className="brand-symbol"><Icon name="calendar" size={24}/></span>Cashlendar.</div><div className="login-story-copy"><span className="small-label">A LITTLE CLARITY, EVERY DAY</span><h1>Your money.<br/>Your family.<br/><em>Your days.</em></h1><p>A shared place for what comes in, what goes out, and what you’re saving for.</p><div className="login-features"><span><Icon name="calendar"/>Calendar</span><span><Icon name="chart"/>Charts</span><span><Icon name="list"/>List</span></div></div><small>One household. One clearer picture.</small></section>
    <main id="main" className="login-main"><div className="login-panel"><span className="small-label">WELCOME TO CASHLENDAR</span><h2>A fresh start for<br/>your everyday money.</h2><p>Sign in to create your household or join your family. Everyone gets their own login and a shared view.</p>
      {params.error && <div className="notice error-notice" role="alert">Google sign-in did not finish. Try again, or check the OAuth callback configuration.</div>}
      {configured ? <LoginButton next={safeNextPath(params.next || null)}/> : <div className="setup-notice"><strong>Connect Supabase to get started</strong><p>Add your project URL and publishable key to <code>.env.local</code>, apply the database migration, and enable Google login.</p><p>The setup steps are in <code>README.md</code>. After configuring, restart the app.</p></div>}
      <div className="login-note"><Icon name="family" size={20}/><span>Share a household, keep your own Google login.</span></div><div className="login-note"><Icon name="download" size={20}/><span>Add Cashlendar to your home screen for daily use.</span></div>
    </div></main></div>;
}
