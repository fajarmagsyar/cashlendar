import Link from 'next/link';
import { getFinanceData, readFilters, getDayEntries } from '@/features/finance/queries';
import { Filters, filterUrl } from '@/features/finance/filters';
import { Summary } from '@/features/finance/summary';
import { CalendarView } from '@/features/finance/calendar-view';
import { EntryList } from '@/features/finance/entry-list';
import { EntryButton } from '@/features/finance/entry-dialog';
import { dayLabel, todayJakarta, validDate } from '@/lib/finance/dates';
export default async function Calendar({ searchParams }: { searchParams:Promise<Record<string,string|string[]|undefined>> }) {
  const params = await searchParams;
  const filters = readFilters(params);
  const selected = typeof params.day==='string' && validDate(params.day) ? params.day : (filters.month===todayJakarta().slice(0,7) ? todayJakarta() : `${filters.month}-01`);
  const data = await getFinanceData({ ...filters,page:1 });
  const dayPage = Math.max(1, Number.parseInt(String(params.daypage || '1')) || 1);
  const entries = await getDayEntries(selected,filters,dayPage);
  return <><div className="page-heading"><div><span className="small-label">YOUR MONEY, DAY BY DAY</span><h1>A little more clarity.</h1><p>Everyday spending, in one shared calendar.</p></div><EntryButton accounts={data.accounts} categories={data.categories} date={selected}/></div>{!data.accounts.length && <div className="notice">Start with an account to record your first entry. <Link href="/accounts">Add an account</Link></div>}<Summary summary={data.summary}/><Filters filters={filters} accounts={data.accounts} categories={data.categories} path="/"/><CalendarView filters={filters} summary={data.summary} selected={selected}/><section className="panel day-panel"><div className="section-heading"><div><span className="small-label">SELECTED DAY</span><h2>{dayLabel(selected)}</h2></div>{selected<=todayJakarta() && <EntryButton accounts={data.accounts} categories={data.categories} date={selected} label="Add for this day"/>}</div><EntryList entries={entries} accounts={data.accounts} categories={data.categories}/>{(dayPage>1 || entries.length===50) && <div className="pagination">{dayPage>1 && <Link className="button small" href={filterUrl('/',filters,{ day:selected,daypage:dayPage-1 })}>Previous entries</Link>}{entries.length===50 && <Link className="button small" href={filterUrl('/',filters,{ day:selected,daypage:dayPage+1 })}>More entries</Link>}</div>}</section></>;
}
