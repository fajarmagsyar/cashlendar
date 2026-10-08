'use client';
import {useI18n} from '@/components/language-provider';

import { useState } from 'react';
import { Dialog } from '@/components/dialog';
import { ActionForm,Field } from '@/components/action-form';
import { Icon } from '@/components/icon';
import { DatePicker } from '@/components/date-picker';
import { EntryButton } from './entry-dialog';
import { payPlannedExpense,deletePlannedExpense } from './actions';
import { todayJakarta } from '@/lib/finance/dates';
import { formatRupiah } from '@/lib/finance/money';
import type { Account,Category,PlannedExpense } from '@/lib/finance/types';

export function PlannedExpenseList({plans,accounts,categories}:{plans:PlannedExpense[];accounts:Account[];categories:Category[]}) {
  const {t}=useI18n();
  const [selected,setSelected]=useState<{plan:PlannedExpense;action:'pay'|'delete'} | null>(null);
  const today=todayJakarta();
  if(!plans.length) return null;
  return <section className="planned-section" aria-label={t("Planned expenses")}><h3>{t("Planned expenses")}</h3><div className="entries">{plans.map(plan=><article className="entry-row planned-row" key={plan.id}>
    <span className="entry-icon planned"><Icon name="calendar"/></span>
    <div className="entry-info"><strong>{plan.note || plan.category_name}</strong><span>{plan.account_name} · {plan.category_name}</span><small>{plan.date<today ? t("Overdue") : t("Planned")}</small></div>
    <strong className="entry-amount">{formatRupiah(plan.amount)}</strong>
    <div className="entry-actions"><button type="button" className="text-button" onClick={()=>setSelected({plan,action:'pay'})}>{t("Mark paid")}</button><EntryButton plan={plan} accounts={accounts} categories={categories}/><button type="button" className="text-button danger" onClick={()=>setSelected({plan,action:'delete'})}>{t("Delete")}</button></div>
  </article>)}</div>{selected && <Dialog title={selected.action==='pay' ? t("Mark expense paid") : t("Delete planned expense?")} onClose={()=>setSelected(null)}>
    <div className="payment-summary"><strong>{selected.plan.note || selected.plan.category_name}</strong><span>{formatRupiah(selected.plan.amount)}</span><small>{selected.plan.account_name}</small></div>
    <ActionForm action={selected.action==='pay' ? input=>payPlannedExpense(selected.plan.id,input) : ()=>deletePlannedExpense(selected.plan.id)} submit={selected.action==='pay' ? t("Record expense") : t("Delete plan")} onSuccess={()=>setSelected(null)}>
      {selected.action==='pay' && <Field label={t("Payment date")}><DatePicker name="date" required min="1900-01-01" max={today} defaultValue={selected.plan.date<=today ? selected.plan.date : today}/></Field>}
    </ActionForm>
  </Dialog>}</section>;
}
