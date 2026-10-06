'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Icon, type IconName } from './icon';
const links: { href:string; name:string; icon:IconName }[] = [
  { href:'/',name:'Calendar',icon:'calendar' },{ href:'/charts',name:'Charts',icon:'chart' },{ href:'/list',name:'List',icon:'list' },
  { href:'/accounts',name:'Accounts',icon:'wallet' },{ href:'/savings',name:'Savings',icon:'savings' },{ href:'/family',name:'Family',icon:'family' }
];
export function Navigation() {
  const path = usePathname();
  const router = useRouter();
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible' && navigator.onLine) router.refresh(); };
    document.addEventListener('visibilitychange',refresh);
    window.addEventListener('online',refresh);
    return () => { document.removeEventListener('visibilitychange',refresh); window.removeEventListener('online',refresh); };
  }, [router]);
  return <nav aria-label="Main navigation" className="navigation">{links.map((link,i)=><Link key={link.href} href={link.href} className={`${path===link.href ? 'active' : ''} ${i>2 ? 'support-link' : ''}`} aria-current={path===link.href ? 'page' : undefined}><Icon name={link.icon}/><span>{link.name}</span></Link>)}</nav>;
}
