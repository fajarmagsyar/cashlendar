'use server';
import { randomBytes, createHash } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';
import { z } from 'zod';
import { requireUser, requireHousehold, getServerSupabase } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/finance/types';

const hash = (token:string) => createHash('sha256').update(token).digest('hex');
export async function createHousehold(input: Record<string,string>): Promise<ActionResult> {
  try {
    const name = z.string().trim().min(1).max(80).parse(input.name);
    const { supabase } = await requireUser('/onboarding');
    const { error } = await supabase.rpc('create_household',{ p_name:name });
    if (error) throw new Error(error.message);
  } catch (error) { unstable_rethrow(error); return { ok:false,error:error instanceof Error ? error.message : 'Could not create your household.' }; }
  redirect('/accounts?setup=1');
}
export async function acceptInvitation(token:string): Promise<ActionResult> {
  try {
    z.string().regex(/^[a-f0-9]{64}$/).parse(token);
    const { supabase } = await requireUser(`/invite?token=${token}`);
    const { error } = await supabase.rpc('accept_invitation',{ p_token_hash:hash(token) });
    if (error) throw new Error(error.message);
  } catch (error) { unstable_rethrow(error); return { ok:false,error:error instanceof Error ? error.message : 'Could not accept this invitation.' }; }
  redirect('/');
}
export async function inviteMember(input: Record<string,string>): Promise<ActionResult<{ path:string }>> {
  try {
    const email = z.email().max(254).parse(input.email);
    const { supabase } = await requireHousehold();
    const token = randomBytes(32).toString('hex');
    const { error } = await supabase.rpc('create_invitation',{ p_email:email,p_token_hash:hash(token) });
    if (error) throw new Error(error.message);
    revalidatePath('/family'); return { ok:true,data:{ path:`/invite?token=${token}` } };
  } catch (error) { unstable_rethrow(error); return { ok:false,error:error instanceof Error ? error.message : 'Could not create an invitation.' }; }
}
export async function manageMember(input:{ id:string; operation:'remove'|'revoke' }): Promise<ActionResult> {
  try {
    const id = z.uuid().parse(input.id);
    const operation = z.enum(['remove','revoke']).parse(input.operation);
    const { supabase } = await requireHousehold();
    const { error } = operation === 'remove' ? await supabase.rpc('remove_member',{ p_user_id:id }) : await supabase.rpc('revoke_invitation',{ p_invitation_id:id });
    if (error) throw new Error(error.message);
    revalidatePath('/family'); return { ok:true };
  } catch (error) { unstable_rethrow(error); return { ok:false,error:error instanceof Error ? error.message : 'Could not update membership.' }; }
}
export async function signOut() {
  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error('Could not sign out. Please try again.');
  redirect('/login');
}
export async function signOutForInvitation(token:string) {
  const parsed = z.string().regex(/^[a-f0-9]{64}$/).parse(token);
  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error('Could not sign out. Please try again.');
  redirect(`/login?next=${encodeURIComponent(`/invite?token=${parsed}`)}`);
}
