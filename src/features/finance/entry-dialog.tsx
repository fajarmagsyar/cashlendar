'use client';
import { useState } from 'react';
import { Dialog } from '@/components/dialog';
import { ActionForm, Field } from '@/components/action-form';
import { Icon } from '@/components/icon';
import { saveEntry, deleteEntry } from './actions';
import { todayJakarta } from '@/lib/finance/dates';
import type { Account, Category, Entry } from '@/lib/finance/types';
export function EntryButton({ accounts,categories,date,entry,defaultKind='expense',defaultAccount='',destination='',label }: {
  accounts:Account[]; categories:Category[]; date?:string; entry?:Entry; defaultKind?:string; defaultAccount?:string; destination?:string; label?:string;
}) {
  const [open,setOpen] = useState(false);
  return <><button type="button" className={entry ? 'text-button' : 'button primary'} onClick={()=>setOpen(true)} disabled={!entry && accounts.every(a=>a.archived_at)}>{!entry && <Icon name="plus" size={18}/>} {label || (entry ? 'Edit' : 'Add transaction')}</button>{open && <EntryDialog accounts={accounts} categories={categories} date={date} entry={entry} defaultKind={defaultKind} defaultAccount={defaultAccount} destination={destination} onClose={()=>setOpen(false)}/>}</>;
}
function EntryDialog({ accounts,categories,date,entry,defaultKind,defaultAccount,destination,onClose }: {
  accounts:Account[]; categories:Category[]; date?:string; entry?:Entry; defaultKind:string; defaultAccount:string; destination:string; onClose:()=>void;
}) {
  const [kind,setKind] = useState(entry?.kind || defaultKind);
  const active = accounts.filter(a=>!a.archived_at);
  const allowedCategories = categories.filter(c=>!c.archived_at && c.kind===kind);
  return <Dialog title={entry ? 'Edit entry' : 'A new entry'} onClose={onClose}><ActionForm action={saveEntry} onSuccess={onClose} submit={entry ? 'Save changes' : 'Save entry'}>
    <input type="hidden" name="id" value={entry?.id || ''}/>
    <Field label="Entry type"><select name="kind" value={kind} onChange={e=>setKind(e.target.value)}>{(!entry || entry.kind!=='transfer') && <><option value="expense">Expense</option><option value="income">Income</option></>}{(!entry || entry.kind==='transfer') && <option value="transfer">Transfer</option>}</select></Field>
    <div className="form-grid"><Field label="Amount (IDR)" hint="Whole rupiah, no decimals or separators."><input name="amount" type="text" inputMode="numeric" pattern="[0-9]+" defaultValue={entry?.amount} required placeholder="0"/></Field><Field label="Date"><input name="date" type="date" min="1900-01-01" max={todayJakarta()} defaultValue={entry?.date || (date && date<=todayJakarta() ? date : todayJakarta())} required/></Field></div>
    <Field label={kind==='transfer' ? 'From account' : 'Account'}><select name="account_id" defaultValue={entry?.account_id || defaultAccount} required><option value="">Choose an account</option>{active.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
    {kind==='transfer' ? <Field label="To account"><select name="destination_account_id" defaultValue={entry?.destination_account_id || destination} required><option value="">Choose a different account</option>{active.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field> : <Field label="Category"><select key={kind} name="category_id" defaultValue={entry?.kind===kind ? entry.category_id || '' : ''} required><option value="">Choose a category</option>{allowedCategories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>}
    <Field label="Note (optional)"><textarea name="note" defaultValue={entry?.note} maxLength={500} rows={3} placeholder="What was it for?"/></Field>
    {kind==='transfer' && <p className="muted">Transfers move money between accounts. They don’t count as income or expenses.</p>}
  </ActionForm></Dialog>;
}
export function DeleteEntryButton({ entry }: { entry:Entry }) {
  const [open,setOpen] = useState(false);
  return <><button className="text-button danger" onClick={()=>setOpen(true)}>Delete</button>{open && <Dialog title="Delete this entry?" onClose={()=>setOpen(false)}><p>This removes the entry and recalculates your balances. This cannot be undone.</p><ActionForm action={()=>deleteEntry({ id:entry.id,kind:entry.kind })} submit="Delete entry" onSuccess={()=>setOpen(false)}><p className="muted">{entry.note || entry.category_name || 'Account transfer'} · {entry.date}</p></ActionForm></Dialog>}</>;
}
