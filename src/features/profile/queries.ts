import 'server-only';
import {requireUser} from '@/lib/supabase/server';
export async function getProfile() {
  const {supabase,user}=await requireUser('/profile');
  const {data,error}=await supabase.from('profiles').select('id,display_name').eq('id',user.id).single();
  if(error || !data) throw new Error('Could not load your profile. Please try again.');
  let avatar_url='';
  for(const candidate of [user.user_metadata.avatar_url,user.user_metadata.picture]) {
    if(typeof candidate!=='string') continue;
    try {const url=new URL(candidate);if(url.protocol==='https:' && !url.username && !url.password){avatar_url=url.href;break;}} catch {}
  }
  return {id:data.id as string,display_name:data.display_name as string,email:user.email || '',avatar_url};
}
