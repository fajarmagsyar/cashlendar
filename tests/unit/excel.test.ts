import {test} from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {createFinanceWorkbook} from '../../src/lib/finance/excel.ts';

test('XLSX keeps attribution, numeric rupiah, literal notes and exact large amounts',async()=>{
  const entry={id:'original-id',kind:'expense' as const,date:'2026-01-06',amount:12500,note:'=HYPERLINK("https://example.com")',account_id:'account',category_id:'category',account_name:'Cash',destination_account_id:null,destination_name:null,category_name:'Food',author:'Ayu',recorded_by:'owner-id'};
  const data={transactions:[entry,{...entry,id:'large',amount:Number.MAX_SAFE_INTEGER}],planned:[{...entry,id:'plan'}]};
  const bytes=await createFinanceWorkbook(data,'2026-01');
  const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(bytes);
  const sheet=workbook.getWorksheet('Transactions')!;
  assert.equal(sheet.rowCount,3);
  assert.equal(sheet.getCell('C2').value,12500);
  assert.equal(sheet.getCell('H2').value,entry.note);
  assert.equal(sheet.getCell('I2').value,'Ayu');
  assert.equal(sheet.getCell('J2').value,'owner-id');
  assert.equal(sheet.getCell('C3').value,'9007199254740991');
  assert.equal(sheet.getCell('A2').text,'2026-01-06');
  assert.equal(workbook.getWorksheet('Planned expenses')!.getCell('I2').value,'Ayu');
});
