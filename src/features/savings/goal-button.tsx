'use client';
import { useState } from 'react';
import { Dialog } from '@/components/dialog';
import { ActionForm,Field } from '@/components/action-form';
import { Icon } from '@/components/icon';
import { AmountInput } from '@/components/amount-input';
import { DatePicker } from '@/components/date-picker';
import { saveGoal } from '@/features/finance/actions';
import type { Account,SavingsGoal } from '@/lib/finance/types';
export function GoalButton({ accounts,goal }: { accounts:Account[]; goal?:SavingsGoal }) {
  const [open,setOpen] = useState(false);
  const eligible = accounts.filter(a=>a.type==='savings' && !a.archived_at);
  return (
    <>
      <button className={goal ? 'text-button' : 'button primary'} disabled={!eligible.length} onClick={() => setOpen(true)}>
        {!goal && <Icon name="plus" size={18} />} {goal ? 'Edit goal' : 'Create savings goal'}
      </button>
      {open && (
        <Dialog title={goal ? 'Edit savings goal' : 'Create savings goal'} onClose={() => setOpen(false)}>
          <ActionForm action={saveGoal} submit="Save goal" onSuccess={() => setOpen(false)}>
            <input name="id" type="hidden" value={goal?.id || ''} />
            <Field label="Goal name">
              <input name="name" required maxLength={80} defaultValue={goal?.name} placeholder="Goal name" />
            </Field>
            <Field label="Savings account">
              <select name="account_id" required defaultValue={goal?.account_id || ''}>
                <option value="">Choose a savings account</option>
                {eligible.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
            </Field>
            <Field label="Target amount (IDR)">
              <AmountInput name="target_amount" required defaultValue={goal?.target_amount} />
            </Field>
            <Field label="Target date (optional)">
              <DatePicker name="target_date" defaultValue={goal?.target_date || ''} min="1900-01-01" />
            </Field>
          </ActionForm>
        </Dialog>
      )}
    </>
  );
}
