import Link from 'next/link';
import {ChartsView} from '@/features/finance/charts-view';
import {ViewTabs} from '@/features/finance/view-tabs';
import {ExportButton} from '@/features/finance/export-button';
import { getFinanceData,readFilters,getDayEntries,getPlannedExpenses } from '@/features/finance/queries';
import { Filters,filterUrl } from '@/features/finance/filters';
import { Summary } from '@/features/finance/summary';
import { CalendarView } from '@/features/finance/calendar-view';
import { EntryList } from '@/features/finance/entry-list';
import { PlannedExpenseList } from '@/features/finance/planned-expense-list';
import { EntryButton } from '@/features/finance/entry-dialog';
import { dayLabel,todayJakarta,validDate } from '@/lib/finance/dates';
export default async function Calendar({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const params=await searchParams;
  const filters=readFilters(params);
  const selected=typeof params.day==='string' && validDate(params.day) && params.day.slice(0,7)===filters.month ? params.day : (filters.month===todayJakarta().slice(0,7) ? todayJakarta() : `${filters.month}-01`);
  const dayPage=Math.max(1,Number.parseInt(String(params.daypage || '1')) || 1);
  const view=filters.view || 'calendar';
  const [data,plans,entries]=await Promise.all([getFinanceData({...filters,page:view==='list' ? filters.page : 1}),view==='calendar' ? getPlannedExpenses(filters) : Promise.resolve([]),view==='calendar' ? getDayEntries(selected,filters,dayPage) : Promise.resolve([])]);
  const dayPlans=plans.filter(p=>p.date===selected);
  return <><div className="page-heading"><h1><span className="desktop-view-title">{view==='calendar' ? 'Calendar' : view==='charts' ? 'Charts' : 'Transactions'}</span><span className="mobile-view-title">Money</span></h1><div className="money-heading-actions"><ExportButton filters={filters}/><EntryButton className="button primary finance-add" accounts={data.accounts} categories={data.categories} date={selected}/></div></div>
    {!data.accounts.length && <div className="notice"><Link href="/accounts">Add an account</Link> to start recording transactions.</div>}
    <ViewTabs filters={filters} selected={selected}/><Summary summary={data.summary}/><Filters filters={filters} accounts={data.accounts} categories={data.categories} path="/" list selected={selected}/>
    <section id="money-panel" role="tabpanel" aria-labelledby={`money-tab-${view}`}><div hidden={view!=='calendar'}>
    {view==='calendar' && <><CalendarView filters={filters} summary={data.summary} selected={selected} plans={plans}/>
    <section className="panel day-panel"><div className="section-heading"><h2>{dayLabel(selected)}</h2><EntryButton accounts={data.accounts} categories={data.categories} date={selected} className="button primary finance-add" label={selected>todayJakarta() ? 'Plan expense' : 'Add for this day'}/></div>
      <PlannedExpenseList plans={dayPlans} accounts={data.accounts} categories={data.categories}/>
      {(entries.length>0 || !dayPlans.length) && <EntryList entries={entries} accounts={data.accounts} categories={data.categories} empty="No transactions for this day."/>}
      {(dayPage>1 || entries.length===50) && <div className="pagination">{dayPage>1 && <Link className="button small" href={filterUrl('/',filters,{day:selected,daypage:dayPage-1})}>Previous entries</Link>}{entries.length===50 && <Link className="button small" href={filterUrl('/',filters,{day:selected,daypage:dayPage+1})}>More entries</Link>}</div>}
    </section></>}
    </div>
    {view==='charts' && <ChartsView summary={data.summary} month={filters.month}/>}
    {view==='list' && <section className="panel"><div className="section-heading"><h2>History</h2><span className="muted">{data.summary.count} {data.summary.count===1 ? 'entry' : 'entries'}</span></div><EntryList entries={data.entries} accounts={data.accounts} categories={data.categories} empty="No transactions match these filters."/><div className="pagination">{filters.page>1 && <Link className="button small" href={filterUrl('/',filters,{page:filters.page-1,day:selected})}>Previous</Link>}<span className="muted">{filters.page} / {Math.max(1,Math.ceil(data.summary.count/50))}</span>{filters.page*50<data.summary.count && <Link className="button small" href={filterUrl('/',filters,{page:filters.page+1,day:selected})}>Next</Link>}</div></section>}
    </section>
  </>;
}
