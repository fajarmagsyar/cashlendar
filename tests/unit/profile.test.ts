import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import {profileSchema} from '../../src/features/profile/schemas.ts';

test('profile names trim whitespace and reject empty or oversized input',()=>{
  assert.equal(profileSchema.parse({display_name:'  Ayu Putri  '}).display_name,'Ayu Putri');
  assert.equal(profileSchema.safeParse({display_name:'   '}).success,false);
  assert.equal(profileSchema.safeParse({display_name:'a'.repeat(101)}).success,false);
  assert.equal(profileSchema.parse({display_name:'a'.repeat(100)}).display_name.length,100);
});
test('profile edits can change only the signed-in name and retain financial creator identity',async()=>{
  const db=new PGlite();
  try {
    await db.exec(`create role authenticated;create role anon;create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth,public to authenticated;grant execute on function auth.uid() to authenticated;`);
    await db.exec(await readFile('supabase/migrations/202610060001_cashlendar.sql','utf8'));
    const owner='10000000-0000-4000-8000-000000000001',member='10000000-0000-4000-8000-000000000002';
    await db.query(`insert into auth.users(id,email,email_confirmed_at) values($1,'owner@example.com',now()),($2,'member@example.com',now())`,[owner,member]);
    await db.exec(`set request.jwt.claim.sub='${owner}';set role authenticated`);
    const hid=(await db.query<{id:string}>(`select create_household('Profile family') as id`)).rows[0].id;
    const aid=(await db.query<{id:string}>(`insert into accounts(household_id,name,type,opening_balance) values($1,'Cash','cash',10000) returning id`,[hid])).rows[0].id;
    const cid=(await db.query<{id:string}>(`select id from categories where kind='expense' limit 1`)).rows[0].id;
    await db.query(`insert into transactions(household_id,account_id,category_id,kind,amount,date) values($1,$2,$3,'expense',100,'2026-01-01')`,[hid,aid,cid]);
    await db.exec('reset role');await db.query(`insert into household_members(household_id,user_id,role) values($1,$2,'member')`,[hid,member]);await db.exec('set role authenticated');
    const foreign=await db.query(`update profiles set display_name='Wrong person' where id=$1 returning id`,[member]);assert.equal(foreign.rows.length,0);
    await db.query(`update profiles set display_name='Ayu Putri' where id=$1`,[owner]);
    assert.equal((await db.query<{author:string}>(`select * from list_entries('2026-01-01','2026-02-01')`)).rows[0].author,'Ayu Putri');
    assert.equal((await db.query<{created_by:string}>(`select created_by from transactions`)).rows[0].created_by,owner);
    await db.exec('reset role;set role anon');await assert.rejects(db.query(`update profiles set display_name='Anonymous'`),/permission/i);
  } finally {await db.close();}
});
