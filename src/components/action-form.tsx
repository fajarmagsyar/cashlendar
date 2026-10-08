'use client';
import {useI18n} from '@/components/language-provider';

import { useState, useRef, useId, cloneElement, isValidElement, createContext, useContext, type ReactElement, type ReactNode, type FormEvent } from 'react';
import type { ActionResult } from '@/lib/finance/types';
import { LoadingAnimation } from './loading-animation';
const FormErrors = createContext<Record<string,string>>({});
export function ActionForm({ children, action, submit='Save', onSuccess,onPendingChange,className='',id,disabled=false }: {
  id?:string;disabled?:boolean;children?:ReactNode; action:(input:Record<string,string>)=>Promise<ActionResult<unknown>>; submit?:string; onSuccess?:()=>void;onPendingChange?:(pending:boolean)=>void;className?:string;
}) {
  const {t}=useI18n();
  const [pending,setPending] = useState(false);
  const submitting=useRef(false);
  const [result,setResult] = useState<ActionResult<unknown> | null>(null);
  async function send(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || disabled) return;
    if (!navigator.onLine) { setResult({ ok:false,error:'You are offline. Reconnect to save; your input is still here.' }); return; }
    const form = event.currentTarget;
    const input=Object.fromEntries(Array.from(new FormData(form).entries()).map(([k,v]) => [k,String(v)]));
    submitting.current=true;
    setPending(true); setResult(null);onPendingChange?.(true);
    try {
      const response = await action(input);
      setResult(response);
      if (response.ok) { onSuccess?.(); }
    } catch { setResult({ ok:false,error:'Could not connect. Your input is still here; please try again.' }); }
    finally { submitting.current=false;setPending(false);onPendingChange?.(false); }
  }
  return <form id={id} onSubmit={send} className={`form ${className}`} aria-busy={pending}>
    <FormErrors.Provider value={result && !result.ok ? result.fieldErrors || {} : {}}><div className="form-fields"><fieldset disabled={pending || disabled}>{children}</fieldset></div></FormErrors.Provider>
    {result && !result.ok && <div className="notice error-notice" role="alert"><p>{t(result.error)}</p></div>}
    {result?.ok && !onSuccess && <p className="success-text" role="status">{t("Saved.")}</p>}
    <button type="submit" className="button primary" disabled={pending || disabled}>{pending && <LoadingAnimation/>}{pending ? t("Saving…") : t(submit)}</button>
    <span className="sr-only" role="status">{pending ? t("Saving…") : ''}</span>
  </form>;
}
export function Field({ label, children, hint }: { label:string; children:ReactNode; hint?:string }) {
  const {t}=useI18n();
  const id = useId();
  const errors = useContext(FormErrors);
  const element = children as ReactElement<{ name?:string; id?:string; 'aria-describedby'?:string; 'aria-invalid'?:boolean }>;
  const error = isValidElement(element) && element.props.name ? errors[element.props.name] : undefined;
  const description = [hint ? `${id}-hint` : '',error ? `${id}-error` : ''].filter(Boolean).join(' ');
  const control = isValidElement(element) ? cloneElement(element,{ id, 'aria-describedby':description || undefined,'aria-invalid':error ? true : undefined }) : children;
  return <div className="field"><label htmlFor={id}>{t(label)}</label>{control}{hint && <small id={`${id}-hint`}>{t(hint)}</small>}{error && <small id={`${id}-error`} className="error-text">{t(error)}</small>}</div>;
}
