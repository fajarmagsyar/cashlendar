import Link from 'next/link';
import { getFinanceData, readFilters } from '@/features/finance/queries';
import { Filters, filterUrl } from '@/features/finance/filters';
import { Summary } from '@/features/finance/summary';
import { EntryList } from '@/features/finance/entry-list';
import { EntryButton } from '@/features/finance/entry-dialog';
export default async function List({ searchParams }: { searchParams:Promise<Record<string,string|string[]|undefined>> }) {
  const filters = readFilters(await searchParams);
  const data = await getFinanceData(filters);
  return <><div className="page-heading"><div><span className="small-label">THE EVERYDAY DETAILS</span><h1>Every entry, together.</h1><p>Find, review, and update your shared transactions.</p></div><EntryButton accounts={data.accounts} categories={data.categories}/></div><Summary summary={data.summary}/><Filters filters={filters} accounts={data.accounts} categories={data.categories} path="/list" list/><section className="panel"><div className="section-heading"><h2>Transaction history</h2><span className="muted">{data.summary.count} {data.summary.count===1 ? 'entry' : 'entries'}</span></div><EntryList entries={data.entries} accounts={data.accounts} categories={data.categories} empty="No entries match your filters."/><div className="pagination">{filters.page>1 && <Link className="button small" href={filterUrl('/list',filters,{ page:filters.page-1 })}>Previous</Link>}<span className="muted">Page {filters.page} of {Math.max(1,Math.ceil(data.summary.count/50))}</span>{filters.page*50<data.summary.count && <Link className="button small" href={filterUrl('/list',filters,{ page:filters.page+1 })}>Next</Link>}</div></section></>;
}
