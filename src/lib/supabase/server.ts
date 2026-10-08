import 'server-only';
import { cache } from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseConfig } from './config';
import type { Household, Membership } from '../finance/types';

export const getServerSupabase = cache(async function getServerSupabase() {
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
});
const getVerifiedIdentity = cache(async () => {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) return null;
  return { supabase, user:{ id:data.claims.sub, email:typeof data.claims.email === 'string' ? data.claims.email : '' } };
});
export async function requireUser(next = '/') {
  if (!supabaseConfig()) redirect('/login');
  const identity = await getVerifiedIdentity();
  if (!identity) redirect(`/login?next=${encodeURIComponent(next)}`);
  return identity;
}
export const requireHousehold = cache(async function requireHousehold() {
  const { supabase, user } = await requireUser();
  const { data:record, error } = await supabase.from('household_members').select('*,household:households(id,name,owner_id)').eq('user_id', user.id).maybeSingle();
  if (error) throw new Error('Could not load your household. Please try again.');
  if (!record) redirect('/onboarding');
  const {household,...membership} = record;
  if (!household || Array.isArray(household)) throw new Error('Could not load your household.');
  return { supabase, user, membership:membership as Membership, household:household as Household };
});
