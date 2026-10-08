import {z} from 'zod';
import {validDate} from '../../lib/finance/dates.ts';
import type {BoardItem,BoardTask} from './types.ts';
const id=z.uuid().transform(value=>value.toLowerCase());
const task=z.object({id,text:z.string().trim().min(1).max(160),done:z.boolean()}).strict();
const point=z.tuple([z.number().min(0).max(1000),z.number().min(0).max(1000)]);
const stroke=z.object({id,color:z.enum(['ink','green','red','blue']),width:z.number().min(1).max(12),points:z.array(point).min(1).max(2000)}).strict();
export const blockSchema=z.discriminatedUnion('type',[
  z.object({id,type:z.literal('text'),text:z.string().max(8000),style:z.enum(['paragraph','heading']),bold:z.boolean(),italic:z.boolean()}).strict(),
  z.object({id,type:z.literal('checklist'),tasks:z.array(task).min(1).max(50).refine(tasks=>new Set(tasks.map(t=>t.id)).size===tasks.length)}).strict(),
  z.object({id,type:z.literal('table'),cells:z.array(z.array(z.string().max(500)).min(1).max(12)).min(1).max(30).refine(rows=>rows.every(row=>row.length===rows[0].length))}).strict(),
  z.object({id,type:z.literal('drawing'),strokes:z.array(stroke).max(200).refine(strokes=>strokes.reduce((n,s)=>n+s.points.length,0)<=12000)}).strict(),
]);
export const documentSchema=z.object({version:z.literal(1),blocks:z.array(blockSchema).max(50).refine(blocks=>new Set(blocks.map(b=>b.id)).size===blocks.length)}).strict().refine(doc=>JSON.stringify(doc).length<=250000);
export type BoardDocument=z.infer<typeof documentSchema>;
export type BoardBlock=z.infer<typeof blockSchema>;
export type DrawingBlock=Extract<BoardBlock,{type:'drawing'}>;
export type TableBlock=Extract<BoardBlock,{type:'table'}>;
export const documentInputSchema=z.object({
  id:z.union([z.uuid(),z.literal('')]).optional(),version:z.coerce.number().int().positive().optional(),
  title:z.string().trim().min(1,'Enter a title.').max(120),
  document:z.string().max(250000).transform((value,ctx)=>{try{return JSON.parse(value) as unknown;}catch{ctx.addIssue({code:'custom',message:'Check your page content.'});return z.NEVER;}}).pipe(documentSchema),
  date:z.string().default(''),time:z.string().default(''),
}).superRefine((item,ctx)=>{
  if(item.id && !item.version) ctx.addIssue({code:'custom',path:['version'],message:'Reopen this item before editing.'});
  if(item.date || item.time) {
    if(!validDate(item.date)) ctx.addIssue({code:'custom',path:['date'],message:'Choose a valid date.'});
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)) ctx.addIssue({code:'custom',path:['time'],message:'Choose a valid time.'});
  }
}).transform(({date,time,...item})=>({...item,due_at:date ? new Date(`${date}T${time}:00+07:00`).toISOString() : null}));
export function textBlock():Extract<BoardBlock,{type:'text'}>{return {id:crypto.randomUUID(),type:'text',text:'',style:'paragraph',bold:false,italic:false};}
export function itemDocument(item:BoardItem):BoardDocument {
  if(item.document) return item.document;
  const blocks:BoardBlock[]=[];
  if(item.body) blocks.push({id:item.id,type:'text',text:item.body,style:'paragraph',bold:false,italic:false});
  if(item.checklist.length) blocks.push({id:item.id.slice(0,-1)+(parseInt(item.id.slice(-1),16)^1).toString(16),type:'checklist',tasks:item.checklist as BoardTask[]});
  return {version:1,blocks};
}
