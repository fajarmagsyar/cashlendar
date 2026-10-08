import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {documentSchema,documentInputSchema} from '../../src/features/board/document.ts';
const one='20000000-0000-4000-8000-000000000001',two='20000000-0000-4000-8000-000000000002';
const text={id:one,type:'text',text:'Hello',style:'paragraph',bold:false,italic:true};

test('shared pages validate every block, limits, unique identifiers, and optional Jakarta reminders',()=>{
  const doc={version:1,blocks:[text,{id:two,type:'table',cells:[['1','=A1+1']]}]};
  assert(documentSchema.safeParse(doc).success);
  assert.equal(documentInputSchema.parse({title:'Page',document:JSON.stringify(doc),date:'2030-01-21',time:'09:00'}).due_at,'2030-01-21T02:00:00.000Z');
  assert.equal(documentInputSchema.parse({title:'Page',document:JSON.stringify(doc)}).due_at,null);
  for(const blocks of [
    [text,text],[{...text,style:null}],[{...text,text:'a'.repeat(8001)}],
    [{id:one,type:'table',cells:[['1'],['1','2']]}],
    [{id:one,type:'checklist',tasks:[{id:one,text:'',done:false}]}],
    [{id:one,type:'drawing',strokes:[{id:one,color:'javascript',width:2,points:[[1,2]]}]}],
    [{id:one,type:'drawing',strokes:[{id:one,color:'ink',width:2,points:[[1001,2]]}]}],
  ]) assert.equal(documentSchema.safeParse({version:1,blocks}).success,false);
});

test('document migration preserves existing pages and shared checklist updates are scoped and atomic',async()=>{
  const db=new PGlite();
  try {
    await db.exec(`create role authenticated;create role anon;create role service_role;create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth,public to authenticated;grant execute on function auth.uid() to authenticated;`);
    const migration='202610080003_board_documents.sql';
    for(const file of (await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql') && f!==migration).sort()) await db.exec(await readFile(`supabase/migrations/${file}`,'utf8'));
    const owner='10000000-0000-4000-8000-000000000001',member='10000000-0000-4000-8000-000000000002',outsider='10000000-0000-4000-8000-000000000003';
    await db.query(`insert into auth.users(id,email,email_confirmed_at) values($1,'owner@docs.test',now()),($2,'member@docs.test',now()),($3,'outsider@docs.test',now())`,[owner,member,outsider]);
    const asUser=async(id:string)=>db.exec(`reset role;set request.jwt.claim.sub='${id}';set role authenticated;`);
    await asUser(owner);const hid=(await db.query<{id:string}>(`select create_household('Docs family') as id`)).rows[0].id;
    await db.exec('reset role');await db.query(`insert into household_members(household_id,user_id,role) values($1,$2,'member')`,[hid,member]);await asUser(owner);
    const tasks=[{id:one,text:'Rice',done:true},{id:two,text:'Milk',done:false}];
    const legacy=(await db.query<{id:string;created_by:string;updated_by:string;version:number;updated_at:Date}>(`insert into board_items(household_id,kind,title,body,checklist) values($1,'todo','Old shopping','Keep this text',$2) returning *`,[hid,JSON.stringify(tasks)])).rows[0];
    const reminder=(await db.query<{id:string;due_at:Date;completed_at:Date}>(`insert into board_items(household_id,kind,title,due_at,completed_at) values($1,'reminder','Old reminder','2030-01-21T02:00:00Z',now()) returning *`,[hid])).rows[0];
    await db.exec('reset role');await db.exec(await readFile(`supabase/migrations/${migration}`,'utf8'));
    const converted=(await db.query<typeof legacy & {document:{blocks:{type:string;text?:string;tasks?:typeof tasks;id:string}[]}}>(`select * from board_items where id=$1`,[legacy.id])).rows[0];
    for(const key of ['id','created_by','updated_by','version'] as const) assert.equal(converted[key],legacy[key]);
    assert.deepEqual(converted.updated_at,legacy.updated_at);
    assert.equal(converted.document.blocks[0].text,'Keep this text');assert.deepEqual(converted.document.blocks[1].tasks,tasks);
    const oldReminder=(await db.query(`select due_at,completed_at from board_items where id=$1`,[reminder.id])).rows[0];
    assert.deepEqual(oldReminder,{due_at:reminder.due_at,completed_at:reminder.completed_at});
    await asUser(member);const block=converted.document.blocks[1].id;
    await db.query(`select set_board_document_task($1,$2,$3,true)`,[legacy.id,block,two]);
    await asUser(owner);await db.query(`select set_board_document_task($1,$2,$3,false)`,[legacy.id,block,one]);
    const shared=(await db.query<{document:typeof converted.document;version:number}>(`select document,version from board_items where id=$1`,[legacy.id])).rows[0];
    assert.deepEqual(shared.document.blocks[1].tasks,[{...tasks[0],done:false},{...tasks[1],done:true}]);
    assert.equal(shared.version,legacy.version+2);
    assert.equal((await db.query(`update board_items set title='Old edit' where id=$1 and version=$2 returning id`,[legacy.id,legacy.version])).rows.length,0);
    for(const invalid of [{...text,style:null},{id:one,type:'drawing',strokes:[{id:one,color:null,width:2,points:[[1,2]]}]},{id:one,type:'table',cells:[['ok'],[3]]}]) {
      await assert.rejects(db.query(`update board_items set document=$2 where id=$1`,[legacy.id,JSON.stringify({version:1,blocks:[invalid]})]),/check constraint/i);
    }
    // A reminder is now a page attribute; notification jobs must include ordinary pages.
    await db.query(`select subscribe_board_push($1,$2,$3,'en')`,['https://fcm.googleapis.com/fcm/send/document-test','A'.repeat(87),'B'.repeat(22)]);
    const due=(await db.query<{id:string}>(`insert into board_items(household_id,kind,title,document,due_at) values($1,'note','Unified reminder',$2,now()-interval '1 minute') returning id`,[hid,JSON.stringify({version:1,blocks:[text]})])).rows[0].id;
    await db.exec(`reset role;update push_subscriptions set created_at=now()-interval '2 minutes';update household_members set joined_at=now()-interval '3 minutes';set role service_role;`);
    const jobs=(await db.query<{jobs:{board_id:string}[]}>(`select claim_board_notifications() as jobs`)).rows[0].jobs;
    assert.equal(jobs.length,1);assert.equal(jobs[0].board_id,due);
    await asUser(member);await db.query(`select set_board_reminder($1,true)`,[due]);
    await asUser(outsider);await db.query(`select create_household('Outside family')`);
    assert.equal((await db.query(`select document from board_items where id=$1`,[legacy.id])).rows.length,0);
    await assert.rejects(db.query(`select set_board_document_task($1,$2,$3,true)`,[legacy.id,block,one]),/not available/i);
  }finally{await db.close();}
});
