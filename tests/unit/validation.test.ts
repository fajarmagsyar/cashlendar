import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeNextPath } from '../../src/lib/supabase/redirects.ts';
import { entrySchema, accountSchema, goalSchema } from '../../src/features/finance/schemas.ts';
const a = '10000000-0000-4000-8000-000000000001', b = '10000000-0000-4000-8000-000000000002';
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
