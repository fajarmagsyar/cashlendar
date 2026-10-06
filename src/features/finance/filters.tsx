import Link from 'next/link';
import type { Account, Category, EntryFilters } from '@/lib/finance/types';
import { Icon } from '@/components/icon';
import { monthLabel, shiftMonth, todayJakarta } from '@/lib/finance/dates';
export function filterUrl(path:string,filters:EntryFilters,overrides:Record<string,string|number> = {}) {
  const values = { ...filters,...overrides };
  const params = new URLSearchParams();
  Object.entries(values).forEach(([k,v])=>{ if (v && !(k==='page' && v===1)) params.set(k,String(v)); });
  return `${path}?${params}`;
}
export function Filters({ filters,accounts,categories,path,list=false }: { filters:EntryFilters; accounts:Account[]; categories:Category[]; path:string; list?:boolean }) {
  return <div className="filter-bar"><div className="month-navigation"><h2>{monthLabel(filters.month)}</h2><div className="month-controls"><Link className="icon-button" href={filterUrl(path,filters,{ month:shiftMonth(filters.month,-1),page:1 })} aria-label="Previous month"><Icon name="left" size={18}/></Link><Link className="icon-button" href={filterUrl(path,filters,{ month:shiftMonth(filters.month,1),page:1 })} aria-label="Next month"><Icon name="right" size={18}/></Link><Link className="button small" href={filterUrl(path,filters,{ month:todayJakarta().slice(0,7),page:1 })}>Today</Link></div></div>
    <form action={path} className="filter-form"><input type="hidden" name="month" value={filters.month}/><label><span className="sr-only">Filter by account</span><select name="account" defaultValue={filters.account}><option value="">All accounts</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}{a.archived_at ? ' (archived)' : ''}</option>)}</select></label><label><span className="sr-only">Filter by category</span><select name="category" defaultValue={filters.category}><option value="">All categories</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    {list && <><label><span className="sr-only">Filter by type</span><select name="kind" defaultValue={filters.kind}><option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option><option value="transfer">Transfers</option></select></label><label><span className="sr-only">Search entries</span><input name="search" defaultValue={filters.search} maxLength={100} placeholder="Search entries…" type="search"/></label></>}
    <button className="button small">Apply</button>{(filters.account || filters.category || filters.kind || filters.search) && <Link href={`${path}?month=${filters.month}`} className="text-button">Clear</Link>}</form>
  </div>;
}
