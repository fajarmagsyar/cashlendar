'use client';
import {createContext,useContext,useEffect,useState,useTransition,type ReactNode} from 'react';
import {useRouter} from 'next/navigation';
import {defaultLocale,localeCookie,translator,type Locale} from '@/lib/i18n/shared';
const Language=createContext<{locale:Locale;t:ReturnType<typeof translator>;setLocale:(locale:Locale)=>void;pending:boolean}>({locale:defaultLocale,t:translator(defaultLocale),setLocale:()=>{},pending:false});
export function LanguageProvider({children,initialLocale}:{children:ReactNode;initialLocale:Locale}) {
  const [locale,setLanguage]=useState(initialLocale);
  const [pending,startTransition]=useTransition();
  const router=useRouter();
  useEffect(()=>{document.documentElement.lang=locale;},[locale]);
  function setLocale(next:Locale) {
    if(next===locale) return;
    document.cookie=`${localeCookie}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==='https:' ? '; Secure' : ''}`;
    setLanguage(next);
    startTransition(()=>router.refresh());
  }
  return <Language.Provider value={{locale,t:translator(locale),setLocale,pending}}>{children}</Language.Provider>;
}
export function useI18n() {return useContext(Language);}
export function LanguageSelect({id='site-language'}:{id?:string}) {
  const {locale,t,setLocale,pending}=useI18n();
  return <select id={id} aria-label={t('Language')} value={locale} aria-busy={pending} onChange={event=>setLocale(event.target.value as Locale)}>
    <option value="en">English</option><option value="id">Bahasa Indonesia</option>
  </select>;
}
