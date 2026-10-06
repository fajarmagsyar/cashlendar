'use client';
import Link from 'next/link';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import {useEffect} from 'react';
import {Icon,type IconName} from './icon';
import {EntryButton} from '@/features/finance/entry-dialog';
import {todayJakarta,validDate,getMonthRange} from '@/lib/finance/dates';
import type {Account,Category} from '@/lib/finance/types';
const links:{href:string;name:string;icon:IconName}[]=[
  {href:'/',name:'Calendar',icon:'calendar'},{href:'/?view=charts',name:'Charts',icon:'chart'},{href:'/?view=list',name:'List',icon:'list'},
  {href:'/accounts',name:'Accounts',icon:'wallet'},{href:'/savings',name:'Savings',icon:'savings'},{href:'/profile',name:'Profile',icon:'profile'}
];
export function Navigation({accounts,categories}:{accounts:Account[];categories:Category[]}) {
  const path=usePathname(),router=useRouter(),params=useSearchParams();
  const view=params.get('view') || 'calendar';
  const selected=params.get('day') || '';
  let month=params.get('month') || todayJakarta().slice(0,7);
  try {getMonthRange(month);} catch {month=todayJakarta().slice(0,7);}
  const date=path!=='/' ? todayJakarta() : validDate(selected) && selected.slice(0,7)===month ? selected : month===todayJakarta().slice(0,7) ? todayJakarta() : `${month}-01`;
  useEffect(()=>{
    const refresh=()=>{if(document.visibilityState==='visible' && navigator.onLine) router.refresh();};
    document.addEventListener('visibilitychange',refresh);window.addEventListener('online',refresh);
    return ()=>{document.removeEventListener('visibilitychange',refresh);window.removeEventListener('online',refresh);};
  },[router]);
  const active=(link:typeof links[number])=>link.href.startsWith('/?') ? path==='/' && view===new URLSearchParams(link.href.split('?')[1]).get('view') : link.href==='/' ? path==='/' && view==='calendar' : link.href==='/profile' ? ['/profile','/settings','/family'].includes(path) : path===link.href;
  const desktopHref=(link:typeof links[number])=>{
    if(!link.href.startsWith('/?') && link.href!=='/') return link.href;
    const next=new URLSearchParams(path==='/' ? params.toString() : '');next.set('view',link.name==='Charts' ? 'charts' : link.name==='List' ? 'list' : 'calendar');next.delete('page');
    return `/?${next}`;
  };
  return <>
    <nav aria-label="Main navigation" className="navigation glass-navigation desktop-navigation">{links.map(link=><Link key={link.href} href={desktopHref(link)} className={active(link) ? 'active' : ''} aria-current={active(link) ? 'page' : undefined}><Icon name={link.icon}/><span>{link.name}</span></Link>)}</nav>
    <nav aria-label="Main navigation" className="navigation glass-navigation mobile-navigation">
      <Link href="/" className={path==='/' ? 'active' : ''} aria-current={path==='/' ? 'page' : undefined}><Icon name="calendar"/><span>Money</span></Link>
      <Link href="/accounts" className={path==='/accounts' ? 'active' : ''} aria-current={path==='/accounts' ? 'page' : undefined}><Icon name="wallet"/><span>Accounts</span></Link>
      <EntryButton accounts={accounts} categories={categories} date={date} iconOnly className="nav-add"/>
      {links.slice(4).map(link=><Link key={link.href} href={link.href} className={active(link) ? 'active' : ''} aria-current={active(link) ? 'page' : undefined}><Icon name={link.icon}/><span>{link.name}</span></Link>)}
    </nav>
  </>;
}
