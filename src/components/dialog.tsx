'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './icon';
export function Dialog({ title, children, onClose }: { title:string; children:ReactNode; onClose:()=>void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} className="dialog" aria-labelledby="dialog-title" onCancel={onClose}>
    <div className="dialog-heading"><h2 id="dialog-title">{title}</h2><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}><Icon name="close"/></button></div>
    {children}
  </dialog>;
}
