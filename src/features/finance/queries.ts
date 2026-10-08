import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import { requireHousehold } from '@/lib/supabase/server';
import { checkedNumber } from '@/lib/finance/money';
import { getMonthRange, todayJakarta } from '@/lib/finance/dates';
import type { Account, Category, Entry, EntryFilters, FinanceData, SavingsGoal,PlannedExpense } from '@/lib/finance/types';

export function readFilters(params: Record<string,string|string[]|undefined>): EntryFilters {
  const text = (key:string) => typeof params[key] === 'string' ? params[key] as string : '';
  let month = text('month') || todayJakarta().slice(0,7);
  try { getMonthRange(month); } catch { month = todayJakarta().slice(0,7); }
  const uuid = (value:string) => z.uuid().safeParse(value).success ? value : '';
  return { view:text('view')==='list' ? 'list' : text('view')==='charts' ? 'charts' : 'calendar', month, account:uuid(text('account')), category:uuid(text('category')), kind:['income','expense','transfer'].includes(text('kind')) ? text('kind') : '', search:text('search').slice(0,100), page:Math.min(100000, Math.max(1, Number.parseInt(text('page')) || 1)) };
}
export const getAccounts = cache(async function getAccounts(): Promise<Account[]> {
  const { supabase, household } = await requireHousehold();
  const [accounts, balances] = await Promise.all([supabase.from('accounts').select('*').eq('household_id',household.id).order('name'),supabase.rpc('account_balances')]);
  if (accounts.error || balances.error) throw new Error(accounts.error?.message || balances.error?.message);
  const byId = new Map((balances.data as { account_id:string; balance:string }[]).map(a => [a.account_id,checkedNumber(a.balance)]));
  return accounts.data.map(a => ({ ...a, opening_balance:checkedNumber(a.opening_balance), balance:byId.get(a.id) ?? checkedNumber(a.opening_balance) })) as Account[];
});
export const getCategories = cache(async function getCategories(): Promise<Category[]> {
  const { supabase, household } = await requireHousehold();
  const { data, error } = await supabase.from('categories').select('*').eq('household_id',household.id).order('name');
  if (error) throw new Error(error.message); return data as Category[];
});
export async function getGoals(): Promise<SavingsGoal[]> {
  const { supabase, household } = await requireHousehold();
  const { data, error } = await supabase.from('savings_goals').select('*').eq('household_id',household.id).order('name');
  if (error) throw new Error(error.message);
  return data.map(g => ({ ...g,target_amount:checkedNumber(g.target_amount) })) as SavingsGoal[];
}
export async function getFinanceData(filters: EntryFilters): Promise<FinanceData> {
  const { supabase } = await requireHousehold();
  const range = getMonthRange(filters.month);
  const args = { p_start:range.start, p_end_exclusive:range.endExclusive, p_account_id:filters.account || null, p_category_id:filters.category || null, p_kind:filters.kind, p_search:filters.search };
  const [accounts,categories,entries,summary] = await Promise.all([getAccounts(),getCategories(),supabase.rpc('list_entries',{ ...args,p_limit:50,p_offset:(filters.page-1)*50 }),supabase.rpc('finance_summary',args)]);
  if (entries.error || summary.error) throw new Error(entries.error?.message || summary.error?.message);
  const raw = summary.data;
  return { accounts,categories,entries:(entries.data as Entry[]).map(e => ({ ...e,amount:checkedNumber(e.amount) })), summary:{
    income:checkedNumber(raw.income), expenses:checkedNumber(raw.expenses), net:checkedNumber(raw.net), count:checkedNumber(raw.count),
    days:raw.days.map((d: {date:string;income:unknown;expenses:unknown}) => ({ date:d.date,income:checkedNumber(d.income),expenses:checkedNumber(d.expenses) })),
    categories:raw.categories.map((c:{name:string;amount:unknown}) => ({ name:c.name,amount:checkedNumber(c.amount) }))
  } };
}
export async function getDayEntries(date:string, filters:EntryFilters, page = 1): Promise<Entry[]> {
  const { supabase } = await requireHousehold();
  const end = new Date(`${date}T00:00:00Z`); end.setUTCDate(end.getUTCDate()+1);
  const { data,error } = await supabase.rpc('list_entries',{ p_start:date,p_end_exclusive:end.toISOString().slice(0,10),p_account_id:filters.account || null,p_category_id:filters.category || null,p_kind:filters.kind,p_search:filters.search,p_limit:50,p_offset:(page-1)*50 });
  if (error) throw new Error(error.message);
  return (data as Entry[]).map(e => ({ ...e,amount:checkedNumber(e.amount) }));
}
export async function getPlannedExpenses(filters:EntryFilters):Promise<PlannedExpense[]> {
  const {supabase}=await requireHousehold();
  const range=getMonthRange(filters.month);
  const {data,error}=await supabase.rpc('list_planned_expenses',{p_start:range.start,p_end_exclusive:range.endExclusive,p_account_id:filters.account || null,p_category_id:filters.category || null});
  if(error) throw new Error(error.message);
  return (data as PlannedExpense[]).filter(p=>(!filters.kind || filters.kind==='expense') && (!filters.search || `${p.note} ${p.account_name} ${p.category_name}`.toLowerCase().includes(filters.search.toLowerCase()))).map(p=>({...p,amount:checkedNumber(p.amount)}));
}
