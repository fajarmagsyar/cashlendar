import { getAccounts,getCategories } from '@/features/finance/queries';
import { AccountButton,CategoryButton,ArchiveButton } from '@/features/accounts/account-controls';
import { formatRupiah,safeSum } from '@/lib/finance/money';
import { Icon } from '@/components/icon';
export default async function Accounts({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const [accounts,categories,params]=await Promise.all([getAccounts(),getCategories(),searchParams]);
  const total=safeSum(accounts.map(a=>a.balance || 0));
  return <><div className="page-heading"><h1>Accounts</h1><AccountButton/></div>
    {params.setup && !accounts.length && <div className="notice">Add your first account with its current balance.</div>}
    <section className="balance-banner"><div><span>Total balance</span><strong>{formatRupiah(total)}</strong></div></section>
    {accounts.length ? <section className="account-grid" aria-label="Accounts">{accounts.map(account=><article key={account.id} className={`account-card ${account.archived_at ? 'archived' : ''}`}>
      <div className="account-card-top"><span className="account-type"><Icon name={account.type==='savings' ? 'savings' : 'wallet'}/>{account.type==='ewallet' ? 'E-wallet' : account.type}</span>{account.archived_at && <span className="status-label">Archived</span>}</div>
      <h2>{account.name}</h2><strong className={`account-balance ${(account.balance || 0)<0 ? 'expense-text' : ''}`}>{formatRupiah(account.balance || 0)}</strong>
      <small>Opening balance {formatRupiah(account.opening_balance)}</small><div className="card-actions"><AccountButton account={account}/><ArchiveButton table="accounts" id={account.id} name={account.name} archived={Boolean(account.archived_at)}/></div>
    </article>)}</section> : <section className="panel empty-state"><Icon name="wallet" size={32}/><h2>No accounts yet</h2><p>Add an account to record transactions.</p><AccountButton/></section>}
    <section className="panel"><div className="section-heading"><h2>Categories</h2><CategoryButton/></div><div className="category-list">{categories.map(category=><div key={category.id} className="category-row"><div><strong>{category.name}</strong><span className="muted">{category.kind}{category.archived_at ? ' · archived' : ''}</span></div><div className="card-actions"><CategoryButton category={category}/><ArchiveButton table="categories" id={category.id} name={category.name} archived={Boolean(category.archived_at)}/></div></div>)}</div></section>
  </>;
}
