import PDFDocument from 'pdfkit';
import type {FinanceExport} from './excel.ts';
import {formatRupiah,safeSum} from './money.ts';

export async function createFinancePdf(data:FinanceExport,month:string):Promise<Buffer> {
  const document=new PDFDocument({size:'A4',margin:40,info:{Title:`Cashlendar ${month}`,Author:'Cashlendar'}});
  const result=new Promise<Buffer>((resolve,reject)=>{
    const chunks:Buffer[]=[];
    document.on('data',chunk=>chunks.push(chunk));
    document.on('end',()=>resolve(Buffer.concat(chunks)));
    document.on('error',reject);
  });
  document.fontSize(24).fillColor('#174f3e').text('Cashlendar');
  document.fontSize(12).fillColor('#263e2b').text(month).moveDown();
  for(const [title,entries] of [['Transactions',data.transactions],['Planned expenses',data.planned]] as const) {
    if(document.y>690) document.addPage();
    document.fontSize(16).text(title).moveDown(.5);
    if(!entries.length) document.fontSize(10).text('No entries.').moveDown();
    for(const entry of entries) {
      if(document.y>680) document.addPage();
      document.fontSize(11).fillColor(entry.kind==='income' ? '#087c42' : entry.kind==='expense' ? '#c13232' : '#263e2b')
        .text(`${entry.date.slice(0,10)}  |  ${entry.kind}  |  ${formatRupiah(entry.amount)}`);
      document.fontSize(10).fillColor('#263e2b').text([entry.account_name,entry.destination_name,entry.category_name].filter(Boolean).join(' / '));
      if(entry.note) document.text(entry.note);
      document.fillColor('#526255').text(`Recorded by: ${entry.author}`).moveDown();
    }
    document.fillColor('#263e2b').fontSize(11).text(`Income: ${formatRupiah(safeSum(entries.filter(e=>e.kind==='income').map(e=>e.amount)))}`);
    document.text(`Expenses: ${formatRupiah(safeSum(entries.filter(e=>e.kind==='expense').map(e=>e.amount)))}`).moveDown();
  }
  document.end();
  return result;
}
