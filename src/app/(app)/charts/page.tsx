import { getFinanceData, readFilters } from '@/features/finance/queries';
import { Filters } from '@/features/finance/filters';
import { Summary } from '@/features/finance/summary';
import { ChartsView } from '@/features/finance/charts-view';
import { EntryButton } from '@/features/finance/entry-dialog';
export default async function Charts({ searchParams }: { searchParams:Promise<Record<string,string|string[]|undefined>> }) {
  const filters = readFilters(await searchParams);
  const data = await getFinanceData(filters);
  return <><div className="page-heading"><div><span className="small-label">SEE THE BIGGER PICTURE</span><h1>Follow your money.</h1><p>A clearer view of your household’s income and expenses.</p></div><EntryButton accounts={data.accounts} categories={data.categories}/></div><Summary summary={data.summary}/><Filters filters={filters} accounts={data.accounts} categories={data.categories} path="/charts"/><ChartsView summary={data.summary} month={filters.month}/></>;
}
