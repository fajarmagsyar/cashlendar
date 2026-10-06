import ExcelJS from 'exceljs';
import type {Entry} from './types.ts';

export type ExportEntry=Entry & {recorded_by:string};
export type FinanceExport={transactions:ExportEntry[];planned:ExportEntry[]};

export async function createFinanceWorkbook(data:FinanceExport,month:string) {
  const workbook=new ExcelJS.Workbook();
  workbook.creator='Cashlendar';
  workbook.title=`Cashlendar ${month}`;
  for(const [name,entries] of [['Transactions',data.transactions],['Planned expenses',data.planned]] as const) {
    const sheet=workbook.addWorksheet(name,{views:[{state:'frozen',ySplit:1}]});
    sheet.columns=[
      {header:'Date',key:'date',width:14},{header:'Type',key:'kind',width:14},
      {header:'Amount (IDR)',key:'amount',width:23},{header:'Account',key:'account_name',width:24},
      {header:'To account',key:'destination_name',width:24},{header:'Category',key:'category_name',width:24},
      {header:'Entry ID',key:'id',width:38},{header:'Note',key:'note',width:46},
      {header:'Recorded by',key:'author',width:26},{header:'Recorder ID',key:'recorded_by',width:38}
    ];
    for(const entry of entries) {
      // Excel numbers keep only 15 significant digits; larger rupiah values must stay text.
      const amount=entry.amount>=1e15 ? String(entry.amount) : entry.amount;
      const row=sheet.addRow({...entry,date:entry.date.slice(0,10),amount});
      row.getCell('amount').numFmt=typeof amount==='number' ? '#,##0' : '@';
      row.getCell('note').alignment={wrapText:true,vertical:'top'};
    }
    sheet.autoFilter='A1:J1';
    const header=sheet.getRow(1);header.height=28;
    header.font={bold:true,color:{argb:'FFFFFFFF'}};
    header.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF174F3E'}};
  }
  return workbook.xlsx.writeBuffer();
}
