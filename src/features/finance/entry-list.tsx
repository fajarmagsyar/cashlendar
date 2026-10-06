import type { Account, Category, Entry } from '@/lib/finance/types';
import { formatRupiah } from '@/lib/finance/money';
import { EntryButton, DeleteEntryButton } from './entry-dialog';
import { Icon } from '@/components/icon';
export function EntryList({ entries,accounts,categories,empty='No entries here yet.' }: { entries:Entry[]; accounts:Account[]; categories:Category[]; empty?:string }) {
  if (!entries.length) return <div className="empty-state"><Icon name="list" size={28}/><h3>{empty}</h3></div>;
  return <div className="entries">{entries.map(entry=><article className="entry-row" key={`${entry.kind}-${entry.id}`}>
    <span className={`entry-icon ${entry.kind}`}><Icon name={entry.kind==='transfer' ? 'arrow' : entry.kind==='income' ? 'plus' : 'wallet'}/></span>
    <div className="entry-info"><strong>{entry.note || entry.category_name || 'Account transfer'}</strong><span>{entry.account_name}{entry.destination_name ? ` → ${entry.destination_name}` : ` · ${entry.category_name}`}</span><small>{entry.date} · {entry.kind}</small><span className="entry-recorder">Recorded by {entry.author}</span></div>
    <strong className={`entry-amount ${entry.kind}`}>{entry.kind==='income' ? '+' : entry.kind==='expense' ? '−' : ''}{formatRupiah(entry.amount)}</strong>
    <div className="entry-actions"><EntryButton entry={entry} accounts={accounts} categories={categories}/><DeleteEntryButton entry={entry}/></div>
  </article>)}</div>;
}
