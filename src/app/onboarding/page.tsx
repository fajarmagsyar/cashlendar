import {getTranslations} from '@/lib/i18n/server';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/supabase/server';
import { OnboardingForm } from '@/features/household/onboarding-form';
import { signOut } from '@/features/household/actions';
export default async function Onboarding() {
  const {t}=await getTranslations();
  const { supabase } = await requireUser('/onboarding');
  const { data,error } = await supabase.from('household_members').select('household_id').maybeSingle();
  if (error) throw new Error('Could not load household membership.');
  if (data) redirect('/');
  return <main id="main" className="onboarding-page"><div className="brand">Cashlendar.</div><span className="small-label">{t("LET’S BEGIN")}</span><h1>{t("Make room for")}<br/>{t("your household.")}</h1><p>{t("One place to manage your family’s everyday money.")}</p><OnboardingForm/><p className="muted">{t("Have an invitation? Open the link your household owner shared.")}</p><form action={signOut}><button className="text-button">{t("Sign out")}</button></form></main>;
}
