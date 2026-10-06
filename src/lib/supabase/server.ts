import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseConfig } from './config';
import type { Household, Membership } from '../finance/types';

export async function getServerSupabase() {
  const config = supabaseConfig();
  if (!config) throw new Error('Supabase is not configured.');
  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, { cookies: {
    getAll: () => cookieStore.getAll(),
    setAll: values => {
      try { values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
      catch { /* Server Component cookies are refreshed by the request proxy. */ }
    }
  } });
}
export async function requireUser(next = '/') {
  if (!supabaseConfig()) redirect('/login');
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return { supabase, user:data.user };
}
export async function requireHousehold() {
  const { supabase, user } = await requireUser();
  const { data:membership, error } = await supabase.from('household_members').select('*').eq('user_id', user.id).maybeSingle();
  if (error) throw new Error('Could not load your household. Please try again.');
  if (!membership) redirect('/onboarding');
  const { data:household, error:householdError } = await supabase.from('households').select('id,name,owner_id').eq('id', membership.household_id).single();
  if (householdError) throw new Error('Could not load your household.');
  return { supabase, user, membership:membership as Membership, household:household as Household };
}
