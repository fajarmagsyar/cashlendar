import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeNextPath } from '../../src/lib/supabase/redirects.ts';
import { entrySchema, accountSchema, goalSchema } from '../../src/features/finance/schemas.ts';
import * as schemas from '../../src/features/finance/schemas.ts';
const a = '10000000-0000-4000-8000-000000000001', b = '10000000-0000-4000-8000-000000000002';
test('money forms accept correctly grouped rupiah without accepting decimals or malformed groups', () => {
  const entry = { kind:'expense', amount:'1.250.000', date:'2026-01-01', account_id:a, category_id:b, note:'' };
  assert.equal(entrySchema.parse(entry).amount,1250000);
  assert.equal(accountSchema.parse({name:'Cash',type:'cash',opening_balance:'1.000'}).opening_balance,1000);
  assert.equal(goalSchema.parse({name:'Goal',account_id:a,target_amount:'2.000.000'}).target_amount,2000000);
  for(const amount of ['1.25','1.000.50','-1.000','1e3','9.007.199.254.740.992']) assert.equal(entrySchema.safeParse({...entry,amount}).success,false);
});
test('planned expenses allow future and overdue dates while recorded transactions stay past-only', () => {
  const input={amount:'150.000',date:'2999-01-01',account_id:a,category_id:b,note:'Planned bill'};
  assert.ok('plannedExpenseSchema' in schemas,'planned expense validation must exist');
  const schema=schemas.plannedExpenseSchema;
  assert.equal(schema.parse(input).amount,150000);
  assert.equal(schema.safeParse({...input,date:'2026-01-01'}).success,true);
  assert.equal(schema.safeParse({...input,date:'2026-02-30'}).success,false);
  assert.equal(schema.safeParse({...input,category_id:''}).success,false);
  assert.equal(entrySchema.safeParse({...input,kind:'expense'}).success,false);
});
test('OAuth only returns to application-relative paths', () => {
  assert.equal(safeNextPath('/invite?token=abc'), '/invite?token=abc');
  for (const value of ['https://evil.example','//evil.example','/\\evil.example','/%2f%2fevil.example','/%5cevil.example','javascript:alert(1)',null]) assert.equal(safeNextPath(value), '/');
});
test('entry schema enforces safe integers, real dates and distinct transfer endpoints', () => {
  const entry = { kind:'expense', amount:'1000', date:'2026-01-01', account_id:a, category_id:b, note:'' };
  assert.equal(entrySchema.parse(entry).amount, 1000);
  for (const amount of ['0','-1','1.5','1e3','9007199254740992']) assert.equal(entrySchema.safeParse({...entry,amount}).success,false);
  assert.equal(entrySchema.safeParse({...entry,date:'2026-02-30'}).success,false);
  assert.equal(entrySchema.safeParse({...entry,date:'2999-01-01'}).success,false);
  assert.equal(entrySchema.safeParse({...entry,kind:'transfer',destination_account_id:a}).success,false);
  assert.equal(entrySchema.safeParse({...entry,kind:'transfer',destination_account_id:b}).success,true);
});
test('opening balances permit zero and goals require a positive target', () => {
  assert.equal(accountSchema.parse({name:'Cash',type:'cash',opening_balance:'0'}).opening_balance,0);
  assert.equal(goalSchema.safeParse({name:'Goal',account_id:a,target_amount:'0',target_date:''}).success,false);
  assert.equal(goalSchema.safeParse({name:'Goal',account_id:a,target_amount:'100',target_date:'2027-01-01'}).success,true);
});
