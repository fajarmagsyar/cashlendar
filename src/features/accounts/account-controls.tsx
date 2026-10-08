'use client';
import {useI18n} from '@/components/language-provider';

import { useState } from 'react';
import { Dialog } from '@/components/dialog';
import { ActionForm, Field } from '@/components/action-form';
import { Icon } from '@/components/icon';
import { AmountInput } from '@/components/amount-input';
import { saveAccount,saveCategory,archiveRecord } from '@/features/finance/actions';
import type { Account,Category } from '@/lib/finance/types';
export function AccountButton({ account }: { account?:Account }) {
  const {t}=useI18n();
  const [open,setOpen] = useState(false);
  return <><button className={account ? 'text-button' : 'button primary'} onClick={()=>setOpen(true)}>{!account && <Icon name="plus" size={18}/>} {account ? t("Edit") : t("Add account")}</button>{open && <Dialog title={account ? t("Edit account") : t("Add account")} onClose={()=>setOpen(false)}><ActionForm action={saveAccount} onSuccess={()=>setOpen(false)} submit={t("Save account")}><input name="id" type="hidden" value={account?.id || ''}/><Field label={t("Account name")}><input name="name" required maxLength={80} defaultValue={account?.name} placeholder={t("Account name")}/></Field><Field label={t("Account type")}><select name="type" defaultValue={account?.type || 'cash'}><option value="cash">{t("Cash")}</option><option value="bank">{t("Bank")}</option><option value="ewallet">{t("E-wallet")}</option><option value="savings">{t("Savings")}</option></select></Field><Field label={t("Opening balance (IDR)")} hint={t("Doesn’t count as income.")}><AmountInput name="opening_balance" required defaultValue={account?.opening_balance ?? 0}/></Field></ActionForm></Dialog>}</>;
}
export function CategoryButton({ category }: { category?:Category }) {
  const {t}=useI18n();
  const [open,setOpen] = useState(false);
  return <><button className={category ? 'text-button' : 'button small'} onClick={()=>setOpen(true)}>{category ? t("Edit") : t("Add category")}</button>{open && <Dialog title={category ? t("Edit category") : t("Add a category")} onClose={()=>setOpen(false)}><ActionForm action={saveCategory} submit={t("Save category")} onSuccess={()=>setOpen(false)}><input type="hidden" name="id" value={category?.id || ''}/><Field label={t("Category name")}><input name="name" defaultValue={category?.name} maxLength={80} required/></Field><Field label={t("Category type")}><select name="kind" defaultValue={category?.kind || 'expense'}><option value="expense">{t("Expense")}</option><option value="income">{t("Income")}</option></select></Field><p className="muted">{t("A category used by existing transactions cannot change type.")}</p></ActionForm></Dialog>}</>;
}
export function ArchiveButton({ table,id,archived,name }: { table:'accounts'|'categories'|'savings_goals'; id:string; archived:boolean; name:string }) {
  const {t}=useI18n();
  const [open,setOpen] = useState(false);
  return <><button className="text-button" onClick={()=>setOpen(true)}>{archived ? t("Restore") : t("Archive")}</button>{open && <Dialog title={t(archived ? 'Restore {name}?' : 'Archive {name}?',{name})} onClose={()=>setOpen(false)}><ActionForm action={()=>archiveRecord({ table,id,restore:archived })} onSuccess={()=>setOpen(false)} submit={archived ? t("Restore") : t("Archive")}><p>{archived ? t("This will make it available for new entries again.") : t("Existing entries and history will stay. This will no longer be available for new entries.")}</p></ActionForm></Dialog>}</>;
}
