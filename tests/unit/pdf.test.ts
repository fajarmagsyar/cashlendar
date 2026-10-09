import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createFinancePdf} from '../../src/lib/finance/pdf.ts';

test('PDF export handles an empty month and paginates long notes',async()=>{
  const empty=await createFinancePdf({transactions:[],planned:[]},'2026-01');
  assert.equal(empty.subarray(0,5).toString(),'%PDF-');
  assert.match(empty.toString(),/%%EOF/);
  const entry={id:'1',kind:'expense' as const,date:'2026-01-06',amount:12000,note:'Lunch '.repeat(250),account_id:'1',category_id:'2',account_name:'Cash',destination_account_id:null,destination_name:null,category_name:'Food',author:'Ayu',recorded_by:'1'};
  const report=await createFinancePdf({transactions:Array.from({length:30},()=>entry),planned:[entry]},'2026-01');
  assert.ok(report.length>empty.length);
  assert.ok((report.toString().match(/\/Type \/Page\b/g) || []).length>1);
});
