'use client';
import {ViewTransition,useState,type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {navigationMotion} from '@/lib/navigation-motion';

export function PageTransition({children}:{children:ReactNode}) {
  const path=usePathname();
  const [navigation,setNavigation]=useState({path,motion:'none'});
  if(navigation.path!==path) setNavigation({path,motion:navigationMotion(navigation.path,path)});
  return <ViewTransition key={path} name="page-content" default="none" update="none" share="page-motion" enter="page-motion" exit="page-motion"><div className="route-page" data-motion={navigation.motion}>{children}</div></ViewTransition>;
}
