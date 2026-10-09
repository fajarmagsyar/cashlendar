import {getTranslations} from '@/lib/i18n/server';
import { getAccounts } from '@/features/finance/queries';
import { AccountButton,ArchiveButton } from '@/features/accounts/account-controls';
import {InspectableCard} from '@/features/accounts/inspectable-card';
import { formatRupiah,safeSum } from '@/lib/finance/money';
import { Icon } from '@/components/icon';
export default async function Accounts({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const {t}=await getTranslations();
  const [accounts,params]=await Promise.all([getAccounts(),searchParams]);
  const total=safeSum(accounts.map(a=>a.balance || 0));
  return <><div className="page-heading"><h1>{t("Accounts")}</h1><AccountButton/></div>
    {params.setup && !accounts.length && <div className="notice">{t("Add your first account with its current balance.")}</div>}
    <section className="wallet-overview"><div><span>{t("Total balance")}</span><strong>{formatRupiah(total)}</strong></div></section>
    {accounts.length ? <section className="account-grid" aria-label={t("Accounts")}>{accounts.map(account=><InspectableCard key={account.id} name={account.name} className={`account-card account-card-${account.type} ${account.archived_at ? 'archived' : ''}`} details={<><small>{t("Opening balance")}</small><strong>{formatRupiah(account.opening_balance)}</strong></>} actions={<><AccountButton account={account}/><ArchiveButton table="accounts" id={account.id} name={account.name} archived={Boolean(account.archived_at)}/></>}>
      <div className="account-card-top"><span className="card-wordmark">Cashlendar</span><div className="account-card-marks">{account.archived_at && <span className="status-label">{t("Archived")}</span>}<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M8 9a5 5 0 0 1 0 6M12 6a10 10 0 0 1 0 12M16 3a15 15 0 0 1 0 18"/></svg></div></div>
      <div className="card-chip" aria-hidden="true"><svg viewBox="0 0 48 36" fill="none"><path d="M16 0v10L10 14H0m48 0H38l-6-4V0M0 22h10l6 4v10m16 0V26l6-4h10M16 10h16v16H16zM0 18h16m16 0h16"/></svg></div>
      <strong className={`account-balance ${(account.balance || 0)<0 ? 'expense-text' : ''}`}>{formatRupiah(account.balance || 0)}</strong>
      <div className="card-holder"><h2>{account.name}</h2><small>{account.type==='ewallet' ? t("E-wallet") : t(account.type)}</small></div>
    </InspectableCard>)}</section> : <section className="panel empty-state"><Icon name="wallet" size={32}/><h2>{t("No accounts yet")}</h2><p>{t("Add an account to record transactions.")}</p><AccountButton/></section>}
  </>;
}
