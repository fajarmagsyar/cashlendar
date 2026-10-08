import {test} from 'node:test';
import assert from 'node:assert/strict';
import {boardSchema} from '../../src/features/board/schema.ts';

test('board input validates lists, stale edits, and reminder times in Jakarta',()=>{
  const base={kind:'note',title:' Family note ',body:'Details'};
  assert.equal(boardSchema.parse(base).title,'Family note');
  assert.equal(boardSchema.parse(base).due_at,null);
  assert.equal(boardSchema.safeParse({...base,title:' '}).success,false);
  assert.equal(boardSchema.safeParse({...base,id:'10000000-0000-4000-8000-000000000001'}).success,false);
  const task={id:'20000000-0000-4000-8000-000000000001',text:'Rice',done:false};
  assert.equal(boardSchema.safeParse({...base,kind:'todo',checklist:JSON.stringify([task])}).success,true);
  for(const checklist of ['invalid','[]',JSON.stringify([task,task]),JSON.stringify([{...task,text:' '}]),JSON.stringify([{...task,done:'true'}])]) {
    assert.equal(boardSchema.safeParse({...base,kind:'todo',checklist}).success,false);
  }
  const reminder={...base,kind:'reminder',date:'2030-01-21',time:'09:00'};
  assert.equal(boardSchema.parse(reminder).due_at,'2030-01-21T02:00:00.000Z');
  for(const invalid of [{date:'2030-02-30'},{time:'24:00'},{date:''},{time:''}]) assert.equal(boardSchema.safeParse({...reminder,...invalid}).success,false);
});
