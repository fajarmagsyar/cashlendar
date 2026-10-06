import Link from 'next/link';
import type { EntryFilters, FinanceSummary } from '@/lib/finance/types';
import { calendarDays, todayJakarta, dayLabel } from '@/lib/finance/dates';
import { compactRupiah, formatRupiah } from '@/lib/finance/money';
import { filterUrl } from './filters';
export function CalendarView({ filters,summary,selected }: { filters:EntryFilters; summary:FinanceSummary; selected:string }) {
  const byDate = new Map(summary.days.map(d=>[d.date,d]));
  const today = todayJakarta();
  return <section className="calendar-panel" aria-label="Monthly calendar"><div className="calendar-weekdays">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><span key={d}>{d}</span>)}</div><div className="calendar-grid">{calendarDays(filters.month).map(({ date,inMonth })=>{
    const day = byDate.get(date);
    return <Link key={date} href={filterUrl('/',filters,{ day:date,page:1 })} className={`calendar-day ${inMonth ? '' : 'outside-month'} ${date===selected ? 'selected-day' : ''} ${date===today ? 'today' : ''}`} aria-current={date===selected ? 'date' : undefined} aria-label={`${dayLabel(date)}${!inMonth ? ', outside this month; select to load entries' : day ? `, income ${formatRupiah(day.income)}, expenses ${formatRupiah(day.expenses)}` : ', no income or expenses'}`}>
      <span className="day-number">{Number(date.slice(-2))}</span><div className="day-totals">{day && day.income>0 && <span className="income-text">+<span className="desktop-rp">Rp </span>{compactRupiah(day.income)}</span>}{day && day.expenses>0 && <span className="expense-text">−<span className="desktop-rp">Rp </span>{compactRupiah(day.expenses)}</span>}</div>
    </Link>;
  })}</div><div className="calendar-legend"><span><i className="summary-dot income-dot"/>Income</span><span><i className="summary-dot expense-dot"/>Expenses</span><span>Select a day to see its entries</span></div></section>;
}
