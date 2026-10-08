'use client';
import {useI18n} from '@/components/language-provider';

import { useEffect,useId,useRef,type ReactNode } from 'react';
import { Icon } from './icon';
export function Dialog({ title, children, onClose,dismissible=true,className='' }: { title:string; children:ReactNode; onClose:()=>void;dismissible?:boolean;className?:string }) {
  const {t}=useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId=useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    const overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    return () => { document.body.style.overflow=overflow;dialog?.close();previous?.focus(); };
  }, []);
  return <dialog ref={ref} className={`dialog ${className}`} aria-labelledby={titleId} onCancel={event=>{if(dismissible) onClose();else event.preventDefault();}}>
    <div className="dialog-heading"><h2 id={titleId}>{t(title)}</h2><button type="button" className="icon-button" aria-label={t("Close dialog")} disabled={!dismissible} onClick={onClose}><Icon name="close"/></button></div>
    {children}
  </dialog>;
}
