import {z} from 'zod';
import {validDate} from '../../lib/finance/dates.ts';

const task=z.object({id:z.uuid().transform(value=>value.toLowerCase()),text:z.string().trim().min(1,'Enter a task.').max(160),done:z.boolean()}).strict();
export const boardSchema=z.object({
  id:z.union([z.uuid(),z.literal('')]).optional(),
  version:z.coerce.number().int().positive().optional(),
  kind:z.enum(['note','todo','reminder']),
  title:z.string().trim().min(1,'Enter a title.').max(120),
  body:z.string().trim().max(4000).default(''),
  checklist:z.string().default('[]').transform((value,ctx)=>{
    try{return JSON.parse(value) as unknown;}catch{ctx.addIssue({code:'custom',message:'Check your task list.'});return z.NEVER;}
  }).pipe(z.array(task).max(50)).refine(items=>new Set(items.map(i=>i.id)).size===items.length,'Check your task list.'),
  date:z.string().default(''),time:z.string().default(''),
}).superRefine((item,ctx)=>{
  if(item.id && !item.version) ctx.addIssue({code:'custom',path:['version'],message:'Reopen this item before editing.'});
  if(item.kind==='todo' && !item.checklist.length) ctx.addIssue({code:'custom',path:['checklist'],message:'Add at least one task.'});
  if(item.kind!=='todo' && item.checklist.length) ctx.addIssue({code:'custom',path:['checklist'],message:'Check your task list.'});
  if(item.kind==='reminder') {
    if(!validDate(item.date)) ctx.addIssue({code:'custom',path:['date'],message:'Choose a valid date.'});
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)) ctx.addIssue({code:'custom',path:['time'],message:'Choose a valid time.'});
  }
}).transform(({date,time,...item})=>({...item,due_at:item.kind==='reminder' ? new Date(`${date}T${time}:00+07:00`).toISOString() : null}));
