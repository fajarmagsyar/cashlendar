import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('export captures all filtered rows with immutable creators and household isolation',async()=>{
  const db=new PGlite();
  try {
    await db.exec(`create role authenticated;create role anon;create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth,public to authenticated;grant execute on function auth.uid() to authenticated;`);
    for(const file of (await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort()) await db.exec(await readFile(`supabase/migrations/${file}`,'utf8'));
    const owner='10000000-0000-4000-8000-000000000001',member='10000000-0000-4000-8000-000000000002',outsider='10000000-0000-4000-8000-000000000003';
    await db.query(`insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,'owner@example.com',now(),'{"full_name":"Ayu"}'),($2,'member@example.com',now(),'{"full_name":"Budi"}'),($3,'other@example.com',now(),'{}')`,[owner,member,outsider]);
    const asUser=async(id:string)=>db.exec(`reset role;set request.jwt.claim.sub='${id}';set role authenticated;`);
    await asUser(owner);const hid=(await db.query<{id:string}>(`select create_household('Export family') as id`)).rows[0].id;
    const aid=(await db.query<{id:string}>(`insert into accounts(household_id,name,type,opening_balance) values($1,'Cash','cash',10000) returning id`,[hid])).rows[0].id;
    const cid=(await db.query<{id:string}>(`select id from categories where kind='expense' limit 1`)).rows[0].id;
    await db.query(`insert into transactions(household_id,account_id,category_id,kind,amount,date,note) select $1,$2,$3,'expense',1,'2026-01-06','Lunch' from generate_series(1,1005)`,[hid,aid,cid]);
    await db.query(`insert into planned_expenses(household_id,account_id,category_id,amount,date,note) values($1,$2,$3,100,'2026-01-21','Lunch next week')`,[hid,aid,cid]);
    await db.exec('reset role');await db.query(`insert into household_members(household_id,user_id,role) values($1,$2,'member')`,[hid,member]);
    await asUser(member);await db.query(`update transactions set note='Edited lunch' where id=(select id from transactions limit 1)`);
    type Report={transactions:{author:string;recorded_by:string;note:string}[];planned:{author:string;recorded_by:string}[]};
    const report=async(kind='',search='')=>(await db.query<{data:Report}>(`select export_finances('2026-01-01','2026-02-01',null,null,$1,$2) as data`,[kind,search])).rows[0].data;
    const all=await report();assert.equal(all.transactions.length,1005);assert.equal(all.planned.length,1);
    assert.equal(all.transactions.find(t=>t.note==='Edited lunch')!.author,'Ayu');
    assert.ok(all.transactions.every(t=>t.recorded_by===owner));assert.equal(all.planned[0].recorded_by,owner);
    assert.equal((await report('income')).transactions.length,0);assert.equal((await report('income')).planned.length,0);
    assert.equal((await report('expense','Edited')).transactions.length,1);assert.equal((await report('expense','Edited')).planned.length,0);
    await asUser(outsider);await db.query(`select create_household('Other')`);assert.deepEqual(await report(),{transactions:[],planned:[]});
    await db.exec('reset role;set role anon');await assert.rejects(db.query(`select export_finances('2026-01-01','2026-02-01')`),/permission/i);
  } finally {await db.close();}
});
