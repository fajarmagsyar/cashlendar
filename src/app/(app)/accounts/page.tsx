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
    <section className="balance-banner"><div><span>{t("Total balance")}</span><strong>{formatRupiah(total)}</strong></div></section>
    {accounts.length ? <section className="account-grid" aria-label={t("Accounts")}>{accounts.map(account=><InspectableCard key={account.id} name={account.name} className={`account-card account-card-${account.type} ${account.archived_at ? 'archived' : ''}`} details={<><small>{t("Opening balance")}</small><strong>{formatRupiah(account.opening_balance)}</strong></>} actions={<><AccountButton account={account}/><ArchiveButton table="accounts" id={account.id} name={account.name} archived={Boolean(account.archived_at)}/></>}>
      <div className="account-card-top"><span className="account-type"><Icon name={account.type==='savings' ? 'savings' : 'wallet'}/>{account.type==='ewallet' ? t("E-wallet") : t(account.type)}</span><div className="account-card-marks">{account.archived_at && <span className="status-label">{t("Archived")}</span>}<Icon name="chip" size={32}/></div></div>
      <h2>{account.name}</h2><strong className={`account-balance ${(account.balance || 0)<0 ? 'expense-text' : ''}`}>{formatRupiah(account.balance || 0)}</strong>
      <small>Cashlendar</small>
    </InspectableCard>)}</section> : <section className="panel empty-state"><Icon name="wallet" size={32}/><h2>{t("No accounts yet")}</h2><p>{t("Add an account to record transactions.")}</p><AccountButton/></section>}
  </>;
}
