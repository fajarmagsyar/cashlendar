import {getTranslations} from '@/lib/i18n/server';
import type { FinanceSummary } from '@/lib/finance/types';
import { formatRupiah } from '@/lib/finance/money';
import { Icon } from '@/components/icon';
export async function Summary({ summary }: { summary:FinanceSummary }) {
  const {t}=await getTranslations();
  return <section aria-label={t("Monthly totals")} className="summary-grid">
    <div className="summary-item"><span><span className="summary-dot income-dot"/>{t("Income")}</span><strong className="income-text">{formatRupiah(summary.income)}</strong></div>
    <div className="summary-item"><span><span className="summary-dot expense-dot"/>{t("Spent")}</span><strong>{formatRupiah(summary.expenses)}</strong></div>
    <div className="summary-item net-summary"><span><Icon name="wallet" size={16}/>{t("Net")}</span><strong>{formatRupiah(summary.net)}</strong></div>
  </section>;
}
