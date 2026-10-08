'use server';
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {unstable_rethrow} from 'next/navigation';
import {requireHousehold} from '@/lib/supabase/server';
import type {ActionResult} from '@/lib/finance/types';
import {boardSchema} from './schema';
import {documentInputSchema} from './document';

function failure(error:unknown):ActionResult {
  unstable_rethrow(error);
  if(error instanceof z.ZodError) return {ok:false,error:'Please check the highlighted fields.',fieldErrors:Object.fromEntries(error.issues.map(i=>[String(i.path[0]),i.message]))};
  return {ok:false,error:error instanceof Error ? error.message : 'Could not save. Please try again.'};
}
const conflict='This item changed. Close and reopen it to see the latest version.';
export async function saveBoardItem(input:Record<string,string>):Promise<ActionResult> {
  try {
    const {id,version,...row}=boardSchema.parse(input);
    const {supabase,household}=await requireHousehold();
    const query=id ? supabase.from('board_items').update(row).eq('id',id).eq('household_id',household.id).eq('version',version!) : supabase.from('board_items').insert({...row,household_id:household.id});
    const {data,error}=await query.select('id').maybeSingle();
    if(error) throw new Error('Could not save. Please try again.');
    if(!data) throw new Error(conflict);
    revalidatePath('/board');return {ok:true};
  }catch(error){return failure(error);}
}
export async function deleteBoardItem(id:string,version:number):Promise<ActionResult> {
  try {
    z.uuid().parse(id);z.number().int().positive().parse(version);
    const {supabase,household}=await requireHousehold();
    const {data,error}=await supabase.from('board_items').delete().eq('id',id).eq('household_id',household.id).eq('version',version).select('id').maybeSingle();
    if(error || !data) throw new Error(conflict);
    revalidatePath('/board');return {ok:true};
  }catch(error){return failure(error);}
}
export async function setBoardState(id:string,done:boolean,taskId?:string):Promise<ActionResult> {
  try {
    z.uuid().parse(id);z.boolean().parse(done);if(taskId) z.uuid().parse(taskId);
    const {supabase}=await requireHousehold();
    const {error}=await supabase.rpc(taskId ? 'set_board_task' : 'set_board_reminder',taskId ? {p_board_id:id,p_task_id:taskId,p_done:done} : {p_board_id:id,p_done:done});
    if(error) throw new Error('Could not save. Please try again.');
    revalidatePath('/board');return {ok:true};
  }catch(error){return failure(error);}
}

export async function saveBoardDocument(input:Record<string,string>):Promise<ActionResult> {
  try {
    const {id,version,...row}=documentInputSchema.parse(input);
    const {supabase,household}=await requireHousehold();
    const previous=id ? await supabase.from('board_items').select('due_at,completed_at').eq('id',id).eq('household_id',household.id).maybeSingle() : null;
    if(previous?.error) throw new Error('Could not save. Please try again.');
    const sameDue=Boolean(row.due_at && previous?.data?.due_at && new Date(previous.data.due_at).getTime()===new Date(row.due_at).getTime());
    const changes={...row,completed_at:sameDue ? previous!.data!.completed_at : null};
    const query=id ? supabase.from('board_items').update(changes).eq('id',id).eq('household_id',household.id).eq('version',version!) : supabase.from('board_items').insert({...changes,kind:'note',household_id:household.id});
    const {data,error}=await query.select('id').maybeSingle();
    if(error) throw new Error('Could not save. Please try again.');
    if(!data) throw new Error(conflict);
    revalidatePath('/board');if(id) revalidatePath(`/board/${id}`);return {ok:true};
  }catch(error){return failure(error);}
}
export async function setBoardDocumentTask(id:string,blockId:string,taskId:string,done:boolean):Promise<ActionResult> {
  try {
    z.uuid().parse(id);z.uuid().parse(blockId);z.uuid().parse(taskId);z.boolean().parse(done);
    const {supabase}=await requireHousehold();
    const {error}=await supabase.rpc('set_board_document_task',{p_board_id:id,p_block_id:blockId,p_task_id:taskId,p_done:done});
    if(error) throw new Error('Could not save. Please try again.');
    revalidatePath('/board');revalidatePath(`/board/${id}`);return {ok:true};
  }catch(error){return failure(error);}
}
