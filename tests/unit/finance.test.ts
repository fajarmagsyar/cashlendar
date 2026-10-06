import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRupiah, safeSum, formatRupiah } from '../../src/lib/finance/money.ts';
import { todayJakarta, getMonthRange, validateEntryDate, calendarDays } from '../../src/lib/finance/dates.ts';
import { accountBalance, cashFlow, savingsProgress } from '../../src/lib/finance/calculations.ts';

test('rupiah amounts reject rounding, exponents, signs, and unsafe values', () => {
  assert.equal(parseRupiah('1000'), 1000);
  assert.equal(parseRupiah('0', true), 0);
  for (const input of ['', ' ', '1.5', '1e3', '-1', '+1', '0', '9007199254740992', '1,000']) assert.throws(() => parseRupiah(input));
  assert.throws(() => safeSum([Number.MAX_SAFE_INTEGER, 1]));
  assert.match(formatRupiah(1000), /1\.000/);
});
test('dates use Jakarta calendar boundaries and validate real dates', () => {
  assert.equal(todayJakarta(new Date('2026-10-05T17:01:00Z')), '2026-10-06');
  assert.deepEqual(getMonthRange('2026-12'), { start: '2026-12-01', endExclusive: '2027-01-01' });
  assert.equal(validateEntryDate('2024-02-29', '2026-10-06'), '2024-02-29');
  for (const date of ['2025-02-29', '2026-13-01', '2026-10-07', 'bad']) assert.throws(() => validateEntryDate(date, '2026-10-06'));
  assert.equal(calendarDays('2026-02').length % 7, 0);
  assert.equal(calendarDays('2024-02').filter(d => d.inMonth).length, 29);
});
test('account balances include transfers while cash flow excludes them', () => {
  const account = { id: 'cash', opening_balance: 100000 };
  const entries = [{ account_id: 'cash', kind: 'income' as const, amount: 50000 }, { account_id: 'cash', kind: 'expense' as const, amount: 20000 }];
  const transfers = [{ source_account_id: 'cash', destination_account_id: 'savings', amount: 30000 }];
  assert.equal(accountBalance(account, entries, transfers), 100000);
  assert.equal(accountBalance({ id: 'savings', opening_balance: 0 }, entries, transfers), 30000);
  assert.deepEqual(cashFlow(entries), { income: 50000, expenses: 20000, net: 30000 });
  assert.equal(accountBalance(account, [{ ...entries[1], amount: 200000 }], []), -100000);
});
test('savings progress is clamped without altering actual balances', () => {
  assert.equal(savingsProgress(-10, 100), 0);
  assert.equal(savingsProgress(50, 100), 50);
  assert.equal(savingsProgress(200, 100), 100);
  assert.throws(() => savingsProgress(50, 0));
});
