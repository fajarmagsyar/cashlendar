import {getTranslations} from '@/lib/i18n/server';
import Link from '@/components/pending-link';
import type { EntryFilters, FinanceSummary,PlannedExpense } from '@/lib/finance/types';
import { calendarDays, todayJakarta, dayLabel } from '@/lib/finance/dates';
import { compactRupiah, formatRupiah } from '@/lib/finance/money';
import { filterUrl } from './filter-url';
export async function CalendarView({ filters,summary,selected,plans=[] }: { filters:EntryFilters; summary:FinanceSummary; selected:string;plans?:PlannedExpense[] }) {
  const {t,locale}=await getTranslations();
  const byDate = new Map(summary.days.map(d=>[d.date,d]));
  const plannedByDate=new Map<string,number>();
  for(const plan of plans) plannedByDate.set(plan.date,(plannedByDate.get(plan.date) || 0)+1);
  const today = todayJakarta();
  return <section className="calendar-panel" aria-label={t("Monthly calendar")}><div className="calendar-weekdays">{[t("Mon"),t("Tue"),t("Wed"),t("Thu"),t("Fri"),t("Sat"),t("Sun")].map(d=><span key={d}>{t(d)}</span>)}</div><div className="calendar-grid">{calendarDays(filters.month).map(({ date,inMonth })=>{
    const day = byDate.get(date);
    const plannedCount=plannedByDate.get(date) || 0;
    return <Link key={date} href={filterUrl('/',filters,{ month:date.slice(0,7),day:date,page:1 })} className={`calendar-day ${inMonth ? '' : 'outside-month'} ${date===selected ? 'selected-day' : ''} ${date===today ? 'today' : ''}`} aria-current={date===selected ? 'date' : undefined} aria-label={`${dayLabel(date,locale)}${!inMonth ? `, ${t('outside this month; select to load entries')}` : day ? `, ${t('income')} ${formatRupiah(day.income)}, ${t('Expenses').toLocaleLowerCase(locale)} ${formatRupiah(day.expenses)}` : `, ${t('no income or expenses')}`}${plannedCount ? `, ${t(plannedCount===1 ? '{count} planned expense' : '{count} planned expenses',{count:plannedCount})}` : ''}`}>
      <span className="day-number">{Number(date.slice(-2))}</span><div className="day-totals">{day && day.income>0 && <span className="income-text">+<span className="desktop-rp">Rp </span>{compactRupiah(day.income)}</span>}{day && day.expenses>0 && <span className="expense-text">−<span className="desktop-rp">Rp </span>{compactRupiah(day.expenses)}</span>}{plannedCount>0 && <span className="day-planned"><i className="planned-dot"/>{plannedCount}<span className="planned-word">{' '}{t("planned")}</span></span>}</div>
    </Link>;
  })}</div><div className="calendar-legend"><span><i className="summary-dot income-dot"/>{t("Income")}</span><span><i className="summary-dot expense-dot"/>{t("Expenses")}</span><span><i className="planned-dot"/>{t("Planned")}</span></div></section>;
}
