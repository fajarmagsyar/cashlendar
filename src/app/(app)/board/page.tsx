import {requireHousehold} from '@/lib/supabase/server';
import {FamilyBoard} from '@/features/board/family-board';
import type {BoardItem} from '@/features/board/types';

export default async function BoardPage() {
  const {supabase,household}=await requireHousehold();
  const [items,profiles]=await Promise.all([
    supabase.from('board_items').select('*').eq('household_id',household.id).order('updated_at',{ascending:false}).order('id'),
    supabase.from('profiles').select('id,display_name'),
  ]);
  if(items.error || profiles.error) throw new Error('Could not load the family board.');
  return <FamilyBoard items={(items.data || []) as BoardItem[]} authors={Object.fromEntries((profiles.data || []).map(p=>[p.id,p.display_name]))} pushReady={Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.CRON_SECRET)}/>;
}
