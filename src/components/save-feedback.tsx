'use client';
import {useI18n} from '@/components/language-provider';

import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {Icon} from './icon';

const SaveFeedback=createContext<(message:string)=>void>(()=>{});

export function SaveFeedbackProvider({children}:{children:ReactNode}) {
  const {t}=useI18n();
  const [notice,setNotice]=useState<{message:string} | null>(null);
  useEffect(()=>{
    if(!notice) return;
    const timeout=window.setTimeout(()=>setNotice(null),5000);
    return ()=>window.clearTimeout(timeout);
  },[notice]);
  return <SaveFeedback.Provider value={message=>setNotice({message})}>
    {children}
    <div className={`save-feedback${notice ? ' visible' : ''}`}>
      <span role="status" aria-live="polite" aria-atomic="true">{notice && <><Icon name="check" size={20}/>{t(notice.message)}</>}</span>
      {notice && <button type="button" className="icon-button" aria-label={t("Dismiss confirmation")} onClick={()=>setNotice(null)}><Icon name="close" size={18}/></button>}
    </div>
  </SaveFeedback.Provider>;
}

export function useSaveFeedback() {return useContext(SaveFeedback);}
