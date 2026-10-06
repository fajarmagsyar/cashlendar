import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
test('overflow-producing writes roll back before blocking balances or reports',async()=>{
  const db=new PGlite();
  try{
    await db.exec(`create role authenticated;create role anon;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema public,auth to authenticated;grant execute on function auth.uid() to authenticated;`);
    await db.exec(await readFile('supabase/migrations/202610060001_cashlendar.sql','utf8'));
    const uid='10000000-0000-4000-8000-000000000001';
    await db.query(`insert into auth.users(id,email,email_confirmed_at) values($1,'owner@example.com',now())`,[uid]);
    await db.exec(`set request.jwt.claim.sub='${uid}';set role authenticated;`);
    const h=(await db.query<{id:string}>(`select create_household('Overflow test') as id`)).rows[0].id;
    const account=(await db.query<{id:string}>(`insert into accounts(household_id,name,type,opening_balance) values($1,'Cash','cash',9007199254740991) returning id`,[h])).rows[0].id;
    const income=(await db.query<{id:string}>(`select id from categories where kind='income' limit 1`)).rows[0].id;
    const expense=(await db.query<{id:string}>(`select id from categories where kind='expense' limit 1`)).rows[0].id;
    await assert.rejects(db.query(`insert into transactions(household_id,account_id,category_id,kind,amount,date) values($1,$2,$3,'income',1,'2026-01-01')`,[h,account,income]),/supported.*range|overflow/i);
    assert.equal((await db.query('select * from transactions')).rows.length,0);
    assert.equal((await db.query<{balance:string}>('select * from account_balances()')).rows[0].balance,'9007199254740991');
    await assert.rejects(db.query(`insert into accounts(household_id,name,type,opening_balance) values($1,'Extra cash','cash',1)`,[h]),/supported.*range|overflow/i);
    await db.query(`update accounts set opening_balance=0 where id=$1`,[account]);
    await db.query(`insert into transactions(household_id,account_id,category_id,kind,amount,date) values($1,$2,$3,'expense',1,'2025-12-01')`,[h,account,expense]);
    await db.query(`insert into transactions(household_id,account_id,category_id,kind,amount,date) values($1,$2,$3,'income',9007199254740991,'2026-01-01')`,[h,account,income]);
    await assert.rejects(db.query(`insert into transactions(household_id,account_id,category_id,kind,amount,date) values($1,$2,$3,'income',1,'2026-01-01')`,[h,account,income]),/supported.*range|overflow/i);
    const result=(await db.query<{result:{income:string}}>(`select finance_summary('2026-01-01','2026-02-01',null,null,'','') as result`)).rows[0].result;
    assert.equal(result.income,'9007199254740991');
    await db.query(`insert into transactions(household_id,account_id,category_id,kind,amount,date) values($1,$2,$3,'expense',1,'2026-01-02')`,[h,account,expense]);
    await db.query(`insert into transactions(household_id,account_id,category_id,kind,amount,date) values($1,$2,$3,'income',2,'2026-02-01')`,[h,account,income]);
    await assert.rejects(db.query(`delete from transactions where kind='expense' and date='2026-01-02'`),/supported.*range|overflow/i);
    assert.equal((await db.query(`select * from transactions where kind='expense' and date='2026-01-02'`)).rows.length,1);
  } finally {await db.close();}
});
