import { safeSum } from './money.ts';
type LedgerEntry = { account_id: string; amount: number; kind: 'income' | 'expense' };
type Movement = { source_account_id: string; destination_account_id: string; amount: number };
export function accountBalance(account: { id: string; opening_balance: number }, entries: LedgerEntry[], transfers: Movement[]): number {
  return safeSum([account.opening_balance,
    ...entries.filter(e => e.account_id === account.id).map(e => e.kind === 'income' ? e.amount : -e.amount),
    ...transfers.filter(t => t.source_account_id === account.id || t.destination_account_id === account.id).map(t => t.source_account_id === account.id ? -t.amount : t.amount)
  ]);
}
export function cashFlow(entries: { amount: number; kind: 'income' | 'expense' }[]) {
  const income = safeSum(entries.filter(e => e.kind === 'income').map(e => e.amount));
  const expenses = safeSum(entries.filter(e => e.kind === 'expense').map(e => e.amount));
  return { income, expenses, net: safeSum([income, -expenses]) };
}
export function savingsProgress(balance: number, target: number): number {
  if (!Number.isSafeInteger(balance) || !Number.isSafeInteger(target) || target <= 0) throw new Error('Invalid savings target.');
  return Math.max(0, Math.min(100, balance / target * 100));
}
