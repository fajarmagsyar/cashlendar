'use client';
import Link from '@/components/pending-link';
import {useRef,type KeyboardEvent} from 'react';
import type {EntryFilters,FinanceView} from '@/lib/finance/types';
import {filterUrl} from './filters';
const views:{view:FinanceView;label:string}[]=[{view:'calendar',label:'Calendar'},{view:'list',label:'List'},{view:'charts',label:'Charts'}];
export function ViewTabs({filters,selected}:{filters:EntryFilters;selected:string}) {
  const ref=useRef<HTMLDivElement>(null);
  function navigate(event:KeyboardEvent<HTMLAnchorElement>,index:number) {
    const next=event.key==='ArrowRight' ? (index+1)%3 : event.key==='ArrowLeft' ? (index+2)%3 : event.key==='Home' ? 0 : event.key==='End' ? 2 : -1;
    if(next<0) return;
    event.preventDefault();
    const tab=ref.current?.querySelectorAll<HTMLAnchorElement>('[role="tab"]')[next];
    tab?.focus();tab?.click();
  }
  return <div ref={ref} role="tablist" aria-label="Money views" className="money-tabs">{views.map(({view,label},index)=><Link key={view} role="tab" id={`money-tab-${view}`} aria-controls="money-panel" aria-selected={(filters.view || 'calendar')===view} tabIndex={(filters.view || 'calendar')===view ? 0 : -1} href={filterUrl('/',filters,{view,page:1,day:selected})} onKeyDown={event=>navigate(event,index)}>{label}</Link>)}</div>;
}
