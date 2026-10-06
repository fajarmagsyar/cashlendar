'use client';
import { useState } from 'react';
import { Dialog } from '@/components/dialog';
import { ActionForm,Field } from '@/components/action-form';
import { Icon } from '@/components/icon';
import { saveGoal } from '@/features/finance/actions';
import type { Account,SavingsGoal } from '@/lib/finance/types';
export function GoalButton({ accounts,goal }: { accounts:Account[]; goal?:SavingsGoal }) {
  const [open,setOpen] = useState(false);
  const eligible = accounts.filter(a=>a.type==='savings' && !a.archived_at);
  return <><button className={goal ? 'text-button' : 'button primary'} disabled={!eligible.length} onClick={()=>setOpen(true)}>{!goal && <Icon name="plus" size={18}/>} {goal ? 'Edit goal' : 'Create savings goal'}</button>{open && <Dialog title={goal ? 'Edit savings goal' : 'Something to save for'} onClose={()=>setOpen(false)}><ActionForm action={saveGoal} submit="Save goal" onSuccess={()=>setOpen(false)}><input name="id" type="hidden" value={goal?.id || ''}/><Field label="Goal name"><input name="name" required maxLength={80} defaultValue={goal?.name} placeholder="e.g. Emergency fund"/></Field><Field label="Savings account" hint="Each account can fund one active goal."><select name="account_id" required defaultValue={goal?.account_id || ''}><option value="">Choose a savings account</option>{eligible.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field><Field label="Target amount (IDR)"><input name="target_amount" inputMode="numeric" pattern="[0-9]+" required defaultValue={goal?.target_amount}/></Field><Field label="Target date (optional)"><input name="target_date" type="date" defaultValue={goal?.target_date || ''} min="1900-01-01"/></Field></ActionForm></Dialog>}</>;
}
