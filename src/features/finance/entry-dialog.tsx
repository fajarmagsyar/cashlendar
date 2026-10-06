'use client';
import { useState } from 'react';
import { Dialog } from '@/components/dialog';
import { ActionForm,Field } from '@/components/action-form';
import { AmountInput } from '@/components/amount-input';
import { DatePicker } from '@/components/date-picker';
import { Icon } from '@/components/icon';
import { saveEntry,deleteEntry,savePlannedExpense } from './actions';
import { todayJakarta } from '@/lib/finance/dates';
import { formatRupiah } from '@/lib/finance/money';
import type { Account,Category,Entry,PlannedExpense } from '@/lib/finance/types';

type EntryProps={accounts:Account[];categories:Category[];date?:string;entry?:Entry;plan?:PlannedExpense;defaultKind?:string;defaultAccount?:string;destination?:string;label?:string;className?:string;iconOnly?:boolean};
export function EntryButton(props:EntryProps) {
  const [open,setOpen]=useState(false);
  const editing=props.entry || props.plan;
  return <><button type="button" aria-label={props.iconOnly ? 'Add transaction' : undefined} className={props.className || (editing ? 'text-button' : 'button primary')} onClick={()=>setOpen(true)} disabled={!editing && props.accounts.every(a=>a.archived_at)}>
    {!editing && <Icon name="plus" size={18}/>} {!props.iconOnly && (props.label || (editing ? 'Edit' : 'Add transaction'))}
  </button>{open && <EntryDialog {...props} onClose={()=>setOpen(false)}/>}</>;
}

function EntryDialog({accounts,categories,date,entry,plan,defaultKind='expense',defaultAccount='',destination='',onClose}:EntryProps & {onClose:()=>void}) {
  const today=todayJakarta();
  const [kind,setKind]=useState(entry?.kind || defaultKind);
  const [planned,setPlanned]=useState(Boolean(plan || (!entry && kind==='expense' && date && date>today)));
  const [entryDate,setEntryDate]=useState(plan?.date || entry?.date || (date && (planned || date<=today) ? date : today));
  const active=accounts.filter(a=>!a.archived_at);
  const record=plan || entry;
  const [accountId,setAccountId]=useState(record?.account_id || defaultAccount || (active.length===1 ? active[0].id : ''));
  const allowedCategories=categories.filter(c=>!c.archived_at && c.kind===kind);
  const account=accounts.find(a=>a.id===accountId);
  const title=record ? (plan ? 'Edit planned expense' : 'Edit transaction') : planned ? 'Plan an expense' : 'Add transaction';
  const types=plan ? ['expense'] : entry?.kind==='transfer' ? ['transfer'] : entry ? ['expense','income'] : ['expense','income','transfer'];
  function chooseKind(next:string) {
    if(next===kind) return;
    setKind(next);setPlanned(false);
    if(entryDate>today) setEntryDate(today);
  }
  function choosePlanned(next:boolean) {
    setPlanned(next);
    if(!next && entryDate>today) setEntryDate(today);
  }
  return <Dialog title={title} onClose={onClose} className="entry-dialog"><ActionForm className="entry-form" action={planned ? savePlannedExpense : saveEntry} onSuccess={onClose} submit={record ? 'Save changes' : planned ? 'Save plan' : kind==='transfer' ? 'Save transfer' : 'Save transaction'}>
    <input type="hidden" name="id" value={record?.id || ''}/><input type="hidden" name="kind" value={kind}/>
    {types.length>1 && <div className="entry-type-switch" role="group" aria-label="Entry type">{types.map(type=><button type="button" key={type} aria-pressed={kind===type} onClick={()=>chooseKind(type)}>{type==='expense' ? 'Expense' : type==='income' ? 'Income' : 'Transfer'}</button>)}</div>}
    <div className="entry-amount-field"><Field label="Amount (IDR)"><AmountInput name="amount" required defaultValue={record?.amount} data-autofocus/></Field></div>
    {kind==='expense' && !record && <div className="expense-timing" role="group" aria-label="Expense timing"><button type="button" aria-pressed={!planned} onClick={()=>choosePlanned(false)}>Spent</button><button type="button" aria-pressed={planned} onClick={()=>choosePlanned(true)}><Icon name="calendar" size={16}/>Planned</button></div>}
    {planned && <p className="planning-caption">Your balance changes when you mark it paid.</p>}
    <div className="form-grid">
      <Field label="Date"><DatePicker name="date" min="1900-01-01" max={planned ? '9999-12-31' : today} value={entryDate} onChange={setEntryDate} required/></Field>
      <Field label={kind==='transfer' ? 'From account' : 'Account'} hint={account ? `Balance ${formatRupiah(account.balance ?? account.opening_balance)}` : undefined}><select name="account_id" value={accountId} onChange={e=>setAccountId(e.target.value)} required><option value="">Choose account</option>{active.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
    </div>
    {kind==='transfer' ? <Field label="To account"><select name="destination_account_id" defaultValue={entry?.destination_account_id || destination} required><option value="">Choose account</option>{active.filter(a=>a.id!==accountId).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field> : <Field label="Category"><select key={kind} name="category_id" defaultValue={record && (plan || entry?.kind===kind) ? record.category_id || '' : ''} required><option value="">Choose category</option>{allowedCategories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>}
    <Field label="Note (optional)"><input name="note" defaultValue={record?.note} maxLength={500} placeholder="What’s it for?"/></Field>
  </ActionForm></Dialog>;
}
export function DeleteEntryButton({entry}:{entry:Entry}) {
  const [open,setOpen]=useState(false);
  return <><button className="text-button danger" onClick={()=>setOpen(true)}>Delete</button>{open && <Dialog title="Delete transaction?" onClose={()=>setOpen(false)}><p>{entry.note || entry.category_name || 'Transfer'} · {formatRupiah(entry.amount)}</p><ActionForm action={()=>deleteEntry({id:entry.id,kind:entry.kind})} submit="Delete entry" onSuccess={()=>setOpen(false)}/></Dialog>}</>;
}
