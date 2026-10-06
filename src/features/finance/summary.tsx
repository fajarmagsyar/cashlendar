import type { FinanceSummary } from '@/lib/finance/types';
import { formatRupiah } from '@/lib/finance/money';
import { Icon } from '@/components/icon';
export function Summary({ summary }: { summary:FinanceSummary }) {
  return <section aria-label="Monthly totals" className="summary-grid">
    <div className="summary-item"><span><span className="summary-dot income-dot"/>Income</span><strong className="income-text">{formatRupiah(summary.income)}</strong></div>
    <div className="summary-item"><span><span className="summary-dot expense-dot"/>Spent</span><strong>{formatRupiah(summary.expenses)}</strong></div>
    <div className="summary-item net-summary"><span><Icon name="wallet" size={16}/>Net</span><strong>{formatRupiah(summary.net)}</strong></div>
  </section>;
}
