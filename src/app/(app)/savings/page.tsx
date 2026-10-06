import Link from 'next/link';
import { getAccounts,getCategories,getGoals } from '@/features/finance/queries';
import { formatRupiah } from '@/lib/finance/money';
import { savingsProgress } from '@/lib/finance/calculations';
import { GoalButton } from '@/features/savings/goal-button';
import { ArchiveButton } from '@/features/accounts/account-controls';
import { EntryButton } from '@/features/finance/entry-dialog';
import { Icon } from '@/components/icon';
export default async function Savings() {
  const [accounts,categories,goals]=await Promise.all([getAccounts(),getCategories(),getGoals()]);
  return <><div className="page-heading"><h1>Savings</h1><GoalButton accounts={accounts}/></div>
    {!accounts.some(a=>a.type==='savings' && !a.archived_at) && <div className="notice"><Link href="/accounts">Add a savings account</Link> to create a goal.</div>}
    {goals.length ? <section className="goal-grid" aria-label="Savings goals">{goals.map(goal=>{
      const account=accounts.find(a=>a.id===goal.account_id),balance=account?.balance || 0,progress=savingsProgress(balance,goal.target_amount);
      return <article className={`goal-card ${goal.archived_at ? 'archived' : ''}`} key={goal.id}><div className="account-card-top"><span className="account-type"><Icon name="savings"/>{account?.name}</span>{goal.archived_at && <span className="status-label">Archived</span>}</div>
        <h2>{goal.name}</h2><div className="goal-amounts"><strong>{formatRupiah(balance)}</strong><span>of {formatRupiah(goal.target_amount)}</span></div>
        <progress value={progress} max="100" aria-label={`${goal.name}: ${Math.round(progress)}% funded`}/><div className="goal-caption"><span>{Math.round(progress)}% funded</span>{goal.target_date && <span>Target: {goal.target_date}</span>}</div>
        {!goal.archived_at && <div className="goal-funding"><EntryButton accounts={accounts} categories={categories} defaultKind="transfer" destination={goal.account_id} label="Add savings"/><EntryButton accounts={accounts} categories={categories} defaultKind="transfer" defaultAccount={goal.account_id} label="Withdraw"/></div>}
        <div className="card-actions"><GoalButton accounts={accounts} goal={goal}/><ArchiveButton table="savings_goals" id={goal.id} name={goal.name} archived={Boolean(goal.archived_at)}/></div>
      </article>;
    })}</section> : <section className="panel empty-state"><Icon name="savings" size={32}/><h2>No savings goals yet</h2><GoalButton accounts={accounts}/></section>}
  </>;
}
