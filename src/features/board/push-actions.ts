'use server';
import {z} from 'zod';
import {unstable_rethrow} from 'next/navigation';
import {requireHousehold} from '@/lib/supabase/server';
import type {ActionResult} from '@/lib/finance/types';

const subscription=z.object({endpoint:z.url().max(2048).refine(value=>{
  const url=new URL(value);
  return url.protocol==='https:' && !url.username && !url.password && !url.port && (['fcm.googleapis.com','updates.push.services.mozilla.com'].includes(url.hostname) || url.hostname.endsWith('.push.apple.com') || url.hostname.endsWith('.notify.windows.com'));
}),keys:z.object({p256dh:z.string().regex(/^[A-Za-z0-9_-]{87}=?$/),auth:z.string().regex(/^[A-Za-z0-9_-]{22}={0,2}$/)})});
export async function savePushSubscription(input:unknown,locale:'id'|'en'):Promise<ActionResult> {
  try {
    const value=subscription.parse(input);z.enum(['id','en']).parse(locale);
    const {supabase}=await requireHousehold();
    const {error}=await supabase.rpc('subscribe_board_push',{p_endpoint:value.endpoint,p_p256dh:value.keys.p256dh,p_auth:value.keys.auth,p_locale:locale});
    if(error) throw error;
    return {ok:true};
  }catch(error){unstable_rethrow(error);return {ok:false,error:'Could not enable notifications. Please try again.'};}
}
export async function removePushSubscription(endpoint:string):Promise<ActionResult> {
  try {
    z.string().max(2048).parse(endpoint);
    const {supabase,user}=await requireHousehold();
    const {error}=await supabase.from('push_subscriptions').delete().eq('endpoint',endpoint).eq('user_id',user.id);
    if(error) throw error;
    return {ok:true};
  }catch(error){unstable_rethrow(error);return {ok:false,error:'Could not disable notifications. Please try again.'};}
}
export async function hasPushSubscription(endpoint:string):Promise<boolean> {
  z.string().max(2048).parse(endpoint);
  const {supabase,user}=await requireHousehold();
  const {data,error}=await supabase.from('push_subscriptions').select('id').eq('endpoint',endpoint).eq('user_id',user.id).maybeSingle();
  if(error) throw new Error('Could not check notifications.');
  return Boolean(data);
}
