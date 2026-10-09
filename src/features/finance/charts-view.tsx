import {getTranslations} from '@/lib/i18n/server';
import type {FinanceSummary} from '@/lib/finance/types';
import {formatRupiah,safeSum,compactRupiah} from '@/lib/finance/money';
import {getMonthRange} from '@/lib/finance/dates';
const colors=['#174f3e','#bd4b2e','#456b96','#947028','#734875','#44796f','#555b63'];

export async function ChartsView({summary,month}:{summary:FinanceSummary;month:string}) {
  const {t}=await getTranslations();
  const end=new Date(`${getMonthRange(month).endExclusive}T00:00:00Z`);end.setUTCDate(0);
  const days=Array.from({length:end.getUTCDate()},(_,i)=>({date:`${month}-${String(i+1).padStart(2,'0')}`,income:0,expenses:0,...summary.days.find(d=>Number(d.date.slice(-2))===i+1)}));
  const maximum=Math.max(1,...days.flatMap(d=>[d.income,d.expenses]));
  const total=safeSum(summary.categories.map(c=>c.amount));
  const categories=summary.categories.filter(c=>c.amount>0);
  return <div className="charts-layout">
    <section className="panel cashflow-chart"><h2>{t('Daily cash flow')}</h2>
      <div className="chart-totals"><span className="income-text">{t('Income')}<strong>+{formatRupiah(summary.income)}</strong></span><span className="expense-text">{t('Expenses')}<strong>−{formatRupiah(summary.expenses)}</strong></span></div>
      {summary.income || summary.expenses ? <>
        <div className="chart-scroll"><svg className="cashflow-svg" viewBox="0 0 760 280" role="img" aria-label={t('Daily cash flow')}>
          {[0,.25,.5,.75,1].map(value=><g key={value}><line x1="80" x2="748" y1={230-value*190} y2={230-value*190} stroke="#d5ddd4" strokeDasharray="3 4"/><text x="70" y={234-value*190} textAnchor="end">{value===0 ? 'Rp 0' : `Rp ${compactRupiah(Math.round(maximum*value))}`}</text></g>)}
          {days.map((day,i)=>{const x=84+i*660/days.length,width=660/days.length/2-2;return <g key={day.date}><title>{`${day.date}: ${t('Income')} ${formatRupiah(day.income)}, ${t('Expenses')} ${formatRupiah(day.expenses)}`}</title><rect x={x} y={230-day.income/maximum*190} width={width} height={day.income/maximum*190} fill="#087c42" rx="2"/><rect x={x+width+1} y={230-day.expenses/maximum*190} width={width} height={day.expenses/maximum*190} fill="#c13232" rx="2"/>{(i===0 || (i+1)%5===0 || i===days.length-1) && <text x={x+width} y="252" textAnchor="middle">{i+1}</text>}</g>;})}
          <text x="414" y="276" textAnchor="middle">{t('Day of month')}</text>
        </svg></div>
        <details className="chart-details"><summary>{t('View daily amounts')}</summary><table><caption className="sr-only">{t('Daily cash flow')}</caption><thead><tr><th>{t('Date')}</th><th>{t('Income')}</th><th>{t('Expenses')}</th></tr></thead><tbody>{days.filter(d=>d.income || d.expenses).map(d=><tr key={d.date}><td>{d.date}</td><td className="income-text">+{formatRupiah(d.income)}</td><td className="expense-text">−{formatRupiah(d.expenses)}</td></tr>)}</tbody></table></details>
      </> : <p className="empty-inline">{t('No cash flow this month. Add an income or expense to start your chart.')}</p>}
    </section>
    <section className="panel category-chart"><h2>{t('Expenses by category')}</h2>
      {total>0 ? <div className="category-breakdown"><figure><svg viewBox="0 0 240 240" className="category-pie" role="img" aria-label={t('Expenses by category')}>
        {categories.map((c,i)=>{const start=safeSum(categories.slice(0,i).map(c=>c.amount))/total*Math.PI*2,share=c.amount/total,angle=start+share*Math.PI*2;const sx=120+108*Math.sin(start),sy=120-108*Math.cos(start),ex=120+108*Math.sin(angle),ey=120-108*Math.cos(angle);const label=`${c.name}: ${formatRupiah(c.amount)} (${(share*100).toFixed(1)}%)`;return share===1 ? <circle key={c.name} cx="120" cy="120" r="108" fill={colors[i%colors.length]}><title>{label}</title></circle> : <path key={c.name} d={`M120 120 L${sx} ${sy} A108 108 0 ${share>.5 ? 1 : 0} 1 ${ex} ${ey} Z`} fill={colors[i%colors.length]} stroke="white" strokeWidth="2"><title>{label}</title></path>;})}
      </svg><figcaption><span>{t('Total expenses')}</span><strong>{formatRupiah(total)}</strong></figcaption></figure>
      <ul className="category-legend">{summary.categories.filter(c=>c.amount>0).map((c,i)=><li key={c.name}><i style={{background:colors[i%colors.length]}} aria-hidden="true"/><span>{c.name}<small>{(c.amount/total*100).toFixed(1)}%</small></span><strong>{formatRupiah(c.amount)}</strong></li>)}</ul></div> : <p className="empty-inline">{t('No expenses yet.')}</p>}
    </section>
  </div>;
}
