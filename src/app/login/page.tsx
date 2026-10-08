import { supabaseConfig } from '@/lib/supabase/config';
import { safeNextPath } from '@/lib/supabase/redirects';
import { Landing } from '@/features/household/landing';
export const dynamic = 'force-dynamic';
export default async function Login({ searchParams }: { searchParams:Promise<Record<string,string|undefined>> }) {
  const params = await searchParams;
  return <Landing configured={Boolean(supabaseConfig())} next={safeNextPath(params.next || null)} error={Boolean(params.error)}/>;
}
