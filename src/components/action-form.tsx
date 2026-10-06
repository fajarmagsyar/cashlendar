'use client';
import { useState, useId, cloneElement, isValidElement, createContext, useContext, type ReactElement, type ReactNode, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { ActionResult } from '@/lib/finance/types';
const FormErrors = createContext<Record<string,string>>({});
export function ActionForm({ children, action, submit='Save', onSuccess,className='' }: {
  children?:ReactNode; action:(input:Record<string,string>)=>Promise<ActionResult<unknown>>; submit?:string; onSuccess?:()=>void;className?:string;
}) {
  const [pending,setPending] = useState(false);
  const [result,setResult] = useState<ActionResult<unknown> | null>(null);
  const router = useRouter();
  async function send(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!navigator.onLine) { setResult({ ok:false,error:'You are offline. Reconnect to save; your input is still here.' }); return; }
    setPending(true); setResult(null);
    const form = event.currentTarget;
    try {
      const response = await action(Object.fromEntries(Array.from(new FormData(form).entries()).map(([k,v]) => [k,String(v)])));
      setResult(response);
      if (response.ok) { onSuccess?.(); router.refresh(); }
    } catch { setResult({ ok:false,error:'Could not connect. Your input is still here; please try again.' }); }
    finally { setPending(false); }
  }
  return <form onSubmit={send} className={`form ${className}`} aria-busy={pending}>
    <FormErrors.Provider value={result && !result.ok ? result.fieldErrors || {} : {}}><div className="form-fields"><fieldset disabled={pending}>{children}</fieldset></div></FormErrors.Provider>
    {result && !result.ok && <div className="notice error-notice" role="alert"><p>{result.error}</p></div>}
    {result?.ok && !onSuccess && <p className="success-text" role="status">Saved.</p>}
    <button className="button primary" disabled={pending}>{pending ? 'Saving…' : submit}</button>
  </form>;
}
export function Field({ label, children, hint }: { label:string; children:ReactNode; hint?:string }) {
  const id = useId();
  const errors = useContext(FormErrors);
  const element = children as ReactElement<{ name?:string; id?:string; 'aria-describedby'?:string; 'aria-invalid'?:boolean }>;
  const error = isValidElement(element) && element.props.name ? errors[element.props.name] : undefined;
  const description = [hint ? `${id}-hint` : '',error ? `${id}-error` : ''].filter(Boolean).join(' ');
  const control = isValidElement(element) ? cloneElement(element,{ id, 'aria-describedby':description || undefined,'aria-invalid':error ? true : undefined }) : children;
  return <div className="field"><label htmlFor={id}>{label}</label>{control}{hint && <small id={`${id}-hint`}>{hint}</small>}{error && <small id={`${id}-error`} className="error-text">{error}</small>}</div>;
}
