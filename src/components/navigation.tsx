'use client';
import {useI18n} from '@/components/language-provider';

import Link, { NavigationProgress } from '@/components/pending-link';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import {useEffect,useState,useTransition,type CSSProperties} from 'react';
import {Icon,type IconName} from './icon';
import {EntryButton} from '@/features/finance/entry-dialog';
import {todayJakarta,validDate,getMonthRange} from '@/lib/finance/dates';
import type {Account,Category} from '@/lib/finance/types';
import {isNestedRoute} from '@/lib/navigation-motion';
const links:{href:string;name:string;icon:IconName}[]=[
  {href:'/',name:'Money',icon:'calendar'},
  {href:'/accounts',name:'Accounts',icon:'wallet'},{href:'/more',name:'More',icon:'tools'},{href:'/profile',name:'Profile',icon:'profile'}
];
export function Navigation({accounts,categories}:{accounts:Account[];categories:Category[]}) {
  const {t}=useI18n();
  const path=usePathname(),router=useRouter(),params=useSearchParams();
  const [pending,startTransition]=useTransition();
  const [destination,setDestination]=useState('');
  const selected=params.get('day') || '';
  let month=params.get('month') || todayJakarta().slice(0,7);
  try {getMonthRange(month);} catch {month=todayJakarta().slice(0,7);}
  const date=path!=='/' ? todayJakarta() : validDate(selected) && selected.slice(0,7)===month ? selected : month===todayJakarta().slice(0,7) ? todayJakarta() : `${month}-01`;
  useEffect(()=>{
    const refresh=()=>{if(!path.startsWith('/board/') && document.visibilityState==='visible' && navigator.onLine) router.refresh();};
    document.addEventListener('visibilitychange',refresh);window.addEventListener('online',refresh);
    return ()=>{document.removeEventListener('visibilitychange',refresh);window.removeEventListener('online',refresh);};
  },[router,path]);
  const active=(link:typeof links[number])=>link.href==='/profile' ? ['/profile','/settings','/family'].includes(path) : link.href==='/more' ? ['/more','/savings','/board'].includes(path) : path===link.href;
  const visualUrl=pending && destination ? new URL(destination,'https://cashlendar.local') : null;
  const visualPath=visualUrl?.pathname || path;
  const desktopIndex=visualPath==='/' ? 0 : visualPath==='/accounts' ? 1 : ['/more','/savings','/board'].includes(visualPath) ? 2 : 3;
  const mobileIndex=visualPath==='/' ? 0 : visualPath==='/accounts' ? 1 : ['/more','/savings','/board'].includes(visualPath) ? 3 : 4;
  function navigate(event:{preventDefault:()=>void},href:string) {
    event.preventDefault();
    setDestination(href);
    startTransition(()=>router.push(href));
  }
  if(isNestedRoute(path)) return null;
  return <>
    <nav aria-label={t("Main navigation")} className="navigation glass-navigation desktop-navigation" style={{'--active-index':desktopIndex} as CSSProperties}>
      <span className="navigation-indicator" aria-hidden="true"/>
      {links.map((link,index)=><Link key={link.href} href={link.href} prefetch={true} onNavigate={event=>navigate(event,link.href)} className={desktopIndex===index ? 'active' : ''} aria-current={active(link) ? 'page' : undefined}><Icon name={link.icon}/><span>{t(link.name)}</span></Link>)}
    </nav>
    <nav aria-label={t("Main navigation")} className="navigation glass-navigation mobile-navigation" style={{'--active-index':mobileIndex} as CSSProperties}>
      <span className="navigation-indicator" aria-hidden="true"/>
      <Link href="/" prefetch={true} onNavigate={event=>navigate(event,'/')} className={mobileIndex===0 ? 'active' : ''} aria-current={path==='/' ? 'page' : undefined}><Icon name="calendar"/><span>{t("Money")}</span></Link>
      <Link href="/accounts" prefetch={true} onNavigate={event=>navigate(event,'/accounts')} className={mobileIndex===1 ? 'active' : ''} aria-current={path==='/accounts' ? 'page' : undefined}><Icon name="wallet"/><span>{t("Accounts")}</span></Link>
      <EntryButton accounts={accounts} categories={categories} date={date} iconOnly className="nav-add"/>
      {links.slice(2).map((link,index)=><Link key={link.href} href={link.href} prefetch={true} onNavigate={event=>navigate(event,link.href)} className={mobileIndex===index+3 ? 'active' : ''} aria-current={active(link) ? 'page' : undefined}><Icon name={link.icon}/><span>{t(link.name)}</span></Link>)}
    </nav>
    <NavigationProgress pending={pending}/>
  </>;
}
