import {notFound} from 'next/navigation';
import {requireHousehold} from '@/lib/supabase/server';
import {BoardPageEditor} from '@/features/board/page-editor';
import type {BoardItem} from '@/features/board/types';
export default async function EditBoardPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const {supabase,household}=await requireHousehold();
  const {data,error}=await supabase.from('board_items').select('*').eq('id',id).eq('household_id',household.id).maybeSingle();
  if(error) throw new Error('Could not load the family board.');if(!data) notFound();
  return <BoardPageEditor key={data.id} item={data as BoardItem}/>;
}
