'use client';
import {useState} from 'react';
import {Icon} from '@/components/icon';
import type {EntryFilters} from '@/lib/finance/types';
export function ExportButton({filters}:{filters:EntryFilters}) {
  const [pending,setPending]=useState(false),[error,setError]=useState('');
  async function download() {
    setPending(true);setError('');
    try {
      const params=new URLSearchParams({month:filters.month,account:filters.account,category:filters.category,kind:filters.kind,search:filters.search});
      const response=await fetch(`/api/export?${params}`,{cache:'no-store'});
      if(!response.ok) {
        const failure=await response.json();
        throw new Error(failure.error || 'Could not export. Please try again.');
      }
      const url=URL.createObjectURL(await response.blob());
      const link=document.createElement('a');link.href=url;link.download=`cashlendar-${filters.month}.xlsx`;
      document.body.appendChild(link);link.click();link.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),1000);
    } catch(cause) {setError(cause instanceof Error ? cause.message : 'Could not export. Please try again.');}
    finally {setPending(false);}
  }
  return <div className="export-control"><button type="button" className="button export-button" aria-label="Export Excel" aria-busy={pending} disabled={pending} onClick={download}><Icon name="download"/><span>{pending ? 'Exporting…' : 'Export Excel'}</span></button>{error && <p className="error-text" role="alert">{error}</p>}</div>;
}
