import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/supabase/server';
import { OnboardingForm } from '@/features/household/onboarding-form';
import { signOut } from '@/features/household/actions';
export default async function Onboarding() {
  const { supabase } = await requireUser('/onboarding');
  const { data,error } = await supabase.from('household_members').select('household_id').maybeSingle();
  if (error) throw new Error('Could not load household membership.');
  if (data) redirect('/');
  return <main id="main" className="onboarding-page"><div className="brand">Cashlendar.</div><span className="small-label">LET’S BEGIN</span><h1>Make room for<br/>your household.</h1><p>One place to manage your family’s everyday money.</p><OnboardingForm/><p className="muted">Have an invitation? Open the link your household owner shared.</p><form action={signOut}><button className="text-button">Sign out</button></form></main>;
}
