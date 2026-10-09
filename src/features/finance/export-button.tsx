'use client';
import {useI18n} from '@/components/language-provider';

import {useState} from 'react';
import {Icon} from '@/components/icon';
import type {EntryFilters} from '@/lib/finance/types';
import {Dialog} from '@/components/dialog';
import {LoadingAnimation} from '@/components/loading-animation';
export function ExportButton({filters}:{filters:EntryFilters}) {
  const {t}=useI18n();
  const [pending,setPending]=useState(false),[error,setError]=useState('');
  const [open,setOpen]=useState(false);
  const [format,setFormat]=useState<'xlsx'|'pdf'>('xlsx');
  async function download(format:'xlsx'|'pdf') {
    setFormat(format);setPending(true);setError('');
    try {
      const params=new URLSearchParams({month:filters.month,account:filters.account,category:filters.category,kind:filters.kind,search:filters.search,format});
      const response=await fetch(`/api/export?${params}`,{cache:'no-store'});
      if(!response.ok) {
        const failure=await response.json();
        throw new Error(failure.error || t("Could not export. Please try again."));
      }
      const url=URL.createObjectURL(await response.blob());
      const link=document.createElement('a');link.href=url;link.download=`cashlendar-${filters.month}.${format}`;
      document.body.appendChild(link);link.click();link.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),1000);
      setOpen(false);
    } catch(cause) {setError(cause instanceof Error ? cause.message : t("Could not export. Please try again."));}
    finally {setPending(false);}
  }
  return <div className="export-control"><button type="button" className="button export-button" aria-label={t("Export")} onClick={()=>{setError('');setOpen(true);}}><Icon name="export"/><span>{t("Export")}</span></button>{open && <Dialog title="Export" dismissible={!pending} onClose={()=>setOpen(false)}>{pending ? <div className="export-progress" role="status" aria-live="polite"><LoadingAnimation/><strong>{t('Preparing {format}…',{format:format==='pdf' ? 'PDF' : 'Excel'})}</strong><small>{`cashlendar-${filters.month}.${format}`}</small></div> : <div className="export-options"><button className="button secondary" onClick={()=>download('xlsx')}>{t('Excel')} <small>.xlsx</small></button><button className="button secondary" onClick={()=>download('pdf')}>PDF <small>.pdf</small></button></div>}{error && <p className="error-text" role="alert">{t(error)}</p>}</Dialog>}</div>;
}
