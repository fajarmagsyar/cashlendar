'use client';
import { useState } from 'react';
import { Dialog } from '@/components/dialog';
import { ActionForm, Field } from '@/components/action-form';
import { Icon } from '@/components/icon';
import { saveAccount,saveCategory,archiveRecord } from '@/features/finance/actions';
import type { Account,Category } from '@/lib/finance/types';
export function AccountButton({ account }: { account?:Account }) {
  const [open,setOpen] = useState(false);
  return <><button className={account ? 'text-button' : 'button primary'} onClick={()=>setOpen(true)}>{!account && <Icon name="plus" size={18}/>} {account ? 'Edit' : 'Add account'}</button>{open && <Dialog title={account ? 'Edit account' : 'Add an account'} onClose={()=>setOpen(false)}><ActionForm action={saveAccount} onSuccess={()=>setOpen(false)} submit="Save account"><input name="id" type="hidden" value={account?.id || ''}/><Field label="Account name"><input name="name" required maxLength={80} defaultValue={account?.name} placeholder="e.g. Daily cash"/></Field><Field label="Account type"><select name="type" defaultValue={account?.type || 'cash'}><option value="cash">Cash</option><option value="bank">Bank</option><option value="ewallet">E-wallet</option><option value="savings">Savings</option></select></Field><Field label="Opening balance (IDR)" hint="Balance before your first recorded transaction."><input name="opening_balance" inputMode="numeric" pattern="[0-9]+" required defaultValue={account?.opening_balance ?? 0}/></Field><p className="muted">All accounts are shared with your household. Opening balances are not income.</p></ActionForm></Dialog>}</>;
}
export function CategoryButton({ category }: { category?:Category }) {
  const [open,setOpen] = useState(false);
  return <><button className={category ? 'text-button' : 'button small'} onClick={()=>setOpen(true)}>{category ? 'Edit' : 'Add category'}</button>{open && <Dialog title={category ? 'Edit category' : 'Add a category'} onClose={()=>setOpen(false)}><ActionForm action={saveCategory} submit="Save category" onSuccess={()=>setOpen(false)}><input type="hidden" name="id" value={category?.id || ''}/><Field label="Category name"><input name="name" defaultValue={category?.name} maxLength={80} required/></Field><Field label="Category type"><select name="kind" defaultValue={category?.kind || 'expense'}><option value="expense">Expense</option><option value="income">Income</option></select></Field><p className="muted">A category used by existing transactions cannot change type.</p></ActionForm></Dialog>}</>;
}
export function ArchiveButton({ table,id,archived,name }: { table:'accounts'|'categories'|'savings_goals'; id:string; archived:boolean; name:string }) {
  const [open,setOpen] = useState(false);
  return <><button className="text-button" onClick={()=>setOpen(true)}>{archived ? 'Restore' : 'Archive'}</button>{open && <Dialog title={`${archived ? 'Restore' : 'Archive'} ${name}?`} onClose={()=>setOpen(false)}><ActionForm action={()=>archiveRecord({ table,id,restore:archived })} onSuccess={()=>setOpen(false)} submit={archived ? 'Restore' : 'Archive'}><p>{archived ? 'This will make it available for new entries again.' : 'Existing entries and history will stay. This will no longer be available for new entries.'}</p></ActionForm></Dialog>}</>;
}
