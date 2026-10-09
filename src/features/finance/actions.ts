'use server';
import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';
import { requireHousehold } from '@/lib/supabase/server';
import { entrySchema, accountSchema, categorySchema, goalSchema, plannedExpenseSchema } from './schemas';
import { validDate,todayJakarta } from '@/lib/finance/dates';
import type { ActionResult } from '@/lib/finance/types';

function refresh() { for (const path of ['/', '/charts', '/list', '/accounts', '/savings', '/family', '/settings']) revalidatePath(path); }
function failure(error: unknown): ActionResult {
  unstable_rethrow(error);
  if (error instanceof z.ZodError) return { ok:false, error:'Please check the highlighted fields.', fieldErrors:Object.fromEntries(error.issues.map(i => [String(i.path[0]),i.message])) };
  return { ok:false, error:error instanceof Error ? error.message : 'Could not save. Please try again.' };
}
export async function saveEntry(input: Record<string,string>): Promise<ActionResult> {
  try {
    const parsed = entrySchema.parse(input);
    const { supabase, household } = await requireHousehold();
    const { id, kind, account_id, category_id, destination_account_id, ...base } = parsed;
    const table = kind === 'transfer' ? 'transfers' : 'transactions';
    const row: Record<string, unknown> = kind === 'transfer'
      ? { ...base, household_id:household.id, source_account_id:account_id, destination_account_id }
      : { ...base, household_id:household.id, kind, account_id, category_id };
    const query = id ? supabase.from(table).update(row).eq('id',id).eq('household_id',household.id) : supabase.from(table).insert(row);
    const { data, error } = await query.select('id').single();
    if (error || !data) throw new Error(error?.message || 'This entry is no longer available.');
    refresh(); return { ok:true };
  } catch (error) { return failure(error); }
}
export async function savePlannedExpense(input:Record<string,string>):Promise<ActionResult> {
  try {
    const { id,...values }=plannedExpenseSchema.parse(input);
    const { supabase,household }=await requireHousehold();
    const row={...values,household_id:household.id};
    const query=id ? supabase.from('planned_expenses').update(row).eq('id',id).eq('household_id',household.id) : supabase.from('planned_expenses').insert(row);
    const { error }=await query.select('id').single();
    if(error) throw new Error(error.message);
    refresh();return {ok:true};
  }catch(error){return failure(error);}
}
export async function deletePlannedExpense(id:string):Promise<ActionResult> {
  try {
    z.uuid().parse(id);
    const {supabase,household}=await requireHousehold();
    const {error}=await supabase.from('planned_expenses').delete().eq('id',id).eq('household_id',household.id).select('id').single();
    if(error) throw new Error('This plan is no longer available.');
    refresh();return {ok:true};
  }catch(error){return failure(error);}
}
export async function payPlannedExpense(id:string,input:Record<string,string>):Promise<ActionResult> {
  try {
    z.uuid().parse(id);
    const {date}=z.object({date:z.string().refine(validDate,'Choose a valid date.').refine(d=>d<=todayJakarta(),'Choose today or an earlier date.')}).parse(input);
    const {supabase}=await requireHousehold();
    const {error}=await supabase.rpc('pay_planned_expense',{p_id:id,p_date:date});
    if(error) throw new Error(error.message);
    refresh();return {ok:true};
  }catch(error){return failure(error);}
}
export async function deleteEntry(input: { id:string; kind:string }): Promise<ActionResult> {
  try {
    const id = z.uuid().parse(input.id);
    const kind = z.enum(['income','expense','transfer']).parse(input.kind);
    const { supabase, household } = await requireHousehold();
    const { data, error } = await supabase.from(kind === 'transfer' ? 'transfers' : 'transactions').delete().eq('id',id).eq('household_id',household.id).select('id').single();
    if (error || !data) throw new Error('Could not delete this entry. It may have already been removed.');
    refresh(); return { ok:true };
  } catch (error) { return failure(error); }
}
export async function saveAccount(input: Record<string,string>): Promise<ActionResult> {
  try {
    const { id, ...values } = accountSchema.parse(input);
    const { supabase, household } = await requireHousehold();
    const row = { ...values, household_id:household.id };
    const query = id ? supabase.from('accounts').update(row).eq('id',id).eq('household_id',household.id) : supabase.from('accounts').insert(row);
    const { error } = await query.select('id').single();
    if (error) throw new Error(error.message); refresh(); return { ok:true };
  } catch (error) { return failure(error); }
}
export async function saveCategory(input: Record<string,string>): Promise<ActionResult> {
  try {
    const { id, ...values } = categorySchema.parse(input);
    const { supabase, household } = await requireHousehold();
    const row = { ...values, household_id:household.id };
    const query = id ? supabase.from('categories').update(row).eq('id',id).eq('household_id',household.id) : supabase.from('categories').insert(row);
    const { error } = await query.select('id').single();
    if (error) throw new Error(error.message); refresh(); return { ok:true };
  } catch (error) { return failure(error); }
}
export async function saveGoal(input: Record<string,string>): Promise<ActionResult> {
  try {
    const { id, ...values } = goalSchema.parse(input);
    const { supabase, household } = await requireHousehold();
    const row = { ...values, target_date:values.target_date || null, household_id:household.id };
    const query = id ? supabase.from('savings_goals').update(row).eq('id',id).eq('household_id',household.id) : supabase.from('savings_goals').insert(row);
    const { error } = await query.select('id').single();
    if (error) throw new Error(error.message); refresh(); return { ok:true };
  } catch (error) { return failure(error); }
}
export async function archiveRecord(input: { table:'accounts'|'categories'|'savings_goals'; id:string; restore?:boolean }): Promise<ActionResult> {
  try {
    const table = z.enum(['accounts','categories','savings_goals']).parse(input.table);
    const id = z.uuid().parse(input.id);
    const { supabase, household } = await requireHousehold();
    const { error } = await supabase.from(table).update({ archived_at:input.restore ? null : new Date().toISOString() }).eq('id',id).eq('household_id',household.id).select('id').single();
    if (error) throw new Error(error.message); refresh(); return { ok:true };
  } catch (error) { return failure(error); }
}
