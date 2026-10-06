'use server';
import {revalidatePath} from 'next/cache';
import {redirect,unstable_rethrow} from 'next/navigation';
import {requireUser} from '@/lib/supabase/server';
import {profileSchema} from './schemas';
import type {ActionResult} from '@/lib/finance/types';
export async function saveProfile(input:Record<string,string>):Promise<ActionResult> {
  const parsed=profileSchema.safeParse(input);
  if(!parsed.success) return {ok:false,error:'Check your name.',fieldErrors:{display_name:parsed.error.issues[0].message}};
  try {
    const {supabase,user}=await requireUser('/profile');
    const {data,error}=await supabase.from('profiles').update({display_name:parsed.data.display_name}).eq('id',user.id).select('id').single();
    if(error || !data) return {ok:false,error:'Could not save your profile. Please try again.'};
    revalidatePath('/','layout');
    return {ok:true};
  } catch(error) {
    unstable_rethrow(error);
    return {ok:false,error:'Could not save your profile. Please try again.'};
  }
}
export async function switchGoogleAccount() {
  const {supabase}=await requireUser('/profile');
  const {error}=await supabase.auth.signOut({scope:'local'});
  if(error) throw new Error('Could not switch accounts. Please try again.');
  redirect('/login?next=%2Fprofile');
}
