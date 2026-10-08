import {getTranslations} from '@/lib/i18n/server';
import {filterUrl} from './filter-url';
import Link from '@/components/pending-link';
import { FilterForm } from '@/components/filter-form';
import type { Account, Category, EntryFilters } from '@/lib/finance/types';
import { Icon } from '@/components/icon';
import { monthLabel, shiftMonth, todayJakarta } from '@/lib/finance/dates';
export async function Filters({ filters,accounts,categories,path,list=false,selected }: { filters:EntryFilters; accounts:Account[]; categories:Category[]; path:string; list?:boolean; selected?:string }) {
  const {t,locale}=await getTranslations();
  return <div className="filter-bar"><div className="month-navigation"><h2>{monthLabel(filters.month,locale)}</h2><div className="month-controls"><Link className="icon-button" href={filterUrl(path,filters,{ month:shiftMonth(filters.month,-1),page:1 })} aria-label={t("Previous month")}><Icon name="left" size={18}/></Link><Link className="icon-button" href={filterUrl(path,filters,{ month:shiftMonth(filters.month,1),page:1 })} aria-label={t("Next month")}><Icon name="right" size={18}/></Link><Link className="button small" href={filterUrl(path,filters,{ month:todayJakarta().slice(0,7),page:1 })}>{t("Today")}</Link></div></div>
    <FilterForm action={path} clear={(filters.account || filters.category || filters.kind || filters.search) && <Link href={filterUrl(path,{...filters,account:'',category:'',kind:'',search:'',page:1},{day:selected || ''})} className="text-button">{t("Clear")}</Link>}><input type="hidden" name="month" value={filters.month}/><input type="hidden" name="view" value={filters.view || 'calendar'}/>{selected && <input type="hidden" name="day" value={selected}/>} <label><span className="sr-only">{t("Filter by account")}</span><select name="account" defaultValue={filters.account}><option value="">{t("All accounts")}</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}{a.archived_at ? t(" (archived)") : ''}</option>)}</select></label><label><span className="sr-only">{t("Filter by category")}</span><select name="category" defaultValue={filters.category}><option value="">{t("All categories")}</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    {list && <><label><span className="sr-only">{t("Filter by type")}</span><select name="kind" defaultValue={filters.kind}><option value="">{t("All types")}</option><option value="income">{t("Income")}</option><option value="expense">{t("Expense")}</option><option value="transfer">{t("Transfers")}</option></select></label><label><span className="sr-only">{t("Search entries")}</span><input name="search" defaultValue={filters.search} maxLength={100} placeholder={t("Search entries…")} type="search"/></label></>}
    </FilterForm>
  </div>;
}
