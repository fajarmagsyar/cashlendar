import { requireUser } from '@/lib/supabase/server';
import { OnboardingForm } from '@/features/household/onboarding-form';
import { signOut,signOutForInvitation } from '@/features/household/actions';
export default async function Invite({ searchParams }: { searchParams:Promise<Record<string,string|undefined>> }) {
  const { token } = await searchParams;
  const { user } = await requireUser(`/invite?token=${encodeURIComponent(token || '')}`);
  const validToken=Boolean(token && /^[a-f0-9]{64}$/.test(token));
  return <main id="main" className="onboarding-page"><div className="brand">Cashlendar.</div><h1>Money is better<br/>managed together.</h1><p>Signed in as {user.email}.</p>{validToken ? <OnboardingForm token={token}/> : <p role="alert">This invitation link is invalid. Ask your household owner for a new one.</p>}<form action={validToken ? signOutForInvitation.bind(null,token!) : signOut}><button className="text-button">Use a different Google account</button></form></main>;
}
