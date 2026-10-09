import {getServerSupabase} from '@/lib/supabase/server';
import {supabaseConfig} from '@/lib/supabase/config';
import {readFilters} from '@/features/finance/queries';
import {getMonthRange} from '@/lib/finance/dates';
import {checkedNumber} from '@/lib/finance/money';
import {createFinanceWorkbook,type FinanceExport,type ExportEntry} from '@/lib/finance/excel';
import {createFinancePdf} from '@/lib/finance/pdf';
export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:Request) {
  const headers={'Cache-Control':'private, no-store, max-age=0'};
  if(!supabaseConfig()) return Response.json({error:'Please sign in to export.'},{status:401,headers});
  const supabase=await getServerSupabase();
  const {data:userData,error:authError}=await supabase.auth.getUser();
  if(authError || !userData.user) return Response.json({error:'Please sign in to export.'},{status:401,headers});
  const {data:membership,error:membershipError}=await supabase.from('household_members').select('household_id').eq('user_id',userData.user.id).maybeSingle();
  if(membershipError) return Response.json({error:'Could not load your household.'},{status:503,headers});
  if(!membership) return Response.json({error:'Join a household before exporting.'},{status:403,headers});
  const filters=readFilters(Object.fromEntries(new URL(request.url).searchParams));
  const range=getMonthRange(filters.month);
  try {
    const {data,error}=await supabase.rpc('export_finances',{p_start:range.start,p_end_exclusive:range.endExclusive,p_account_id:filters.account || null,p_category_id:filters.category || null,p_kind:filters.kind,p_search:filters.search});
    if(error) throw error;
    const normalize=(entries:ExportEntry[])=>entries.map(e=>({...e,amount:checkedNumber(e.amount)}));
    const report:FinanceExport={transactions:normalize(data.transactions),planned:normalize(data.planned)};
    if(new URL(request.url).searchParams.get('format')==='pdf') {
      const bytes=await createFinancePdf(report,filters.month);
      return new Response(new Uint8Array(bytes),{headers:{...headers,'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="cashlendar-${filters.month}.pdf"`}});
    }
    const bytes=await createFinanceWorkbook(report,filters.month);
    return new Response(new Uint8Array(bytes),{headers:{...headers,'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':`attachment; filename="cashlendar-${filters.month}.xlsx"`}});
  } catch {
    return Response.json({error:'Could not export. Please try again.'},{status:503,headers});
  }
}
