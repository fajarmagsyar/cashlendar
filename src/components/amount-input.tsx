'use client';
import { useLayoutEffect,useRef,useState,type InputHTMLAttributes } from 'react';
import { formatAmountInput } from '@/lib/finance/money';

type Props=Omit<InputHTMLAttributes<HTMLInputElement>,'type'|'value'|'defaultValue'|'onChange'> & {defaultValue?:string|number};
export function AmountInput({defaultValue='',className='',...props}:Props) {
  const [value,setValue]=useState(()=>formatAmountInput(String(defaultValue)));
  const ref=useRef<HTMLInputElement>(null);
  const selection=useRef<number|null>(null);
  useLayoutEffect(()=>{
    if(selection.current!==null) ref.current?.setSelectionRange(selection.current,selection.current);
    selection.current=null;
  },[value]);
  function update(raw:string,position:number,editing=false) {
    const valid=editing ? /^[\d.]*$/.test(raw) : /^(?:\d*|[1-9]\d{0,2}(?:\.\d{3})+)$/.test(raw);
    const digitsBefore=raw.slice(0,position).replaceAll('.','').length;
    const next=valid ? formatAmountInput(raw.replaceAll('.','')) : raw;
    setValue(next);
    if(valid) {
      let caret=0,count=0;
      while(caret<next.length && count<digitsBefore) {if(next[caret]!=='.') count++;caret++;}
      selection.current=caret;
      if(next===value) {ref.current?.setSelectionRange(caret,caret);selection.current=null;}
    }
  }
  return <div className={`amount-control ${className}`}><span aria-hidden="true">Rp</span><input {...props} ref={ref} type="text" inputMode="numeric" autoComplete="off" placeholder="0" value={value}
    onChange={e=>{
      const event=e.nativeEvent as InputEvent;
      const editing=/^(?:\d*|[1-9]\d{0,2}(?:\.\d{3})+)$/.test(value) && (event.inputType?.startsWith('delete') || (event.inputType==='insertText' && /^\d$/.test(event.data || '')));
      update(e.target.value,e.target.selectionStart ?? e.target.value.length,editing);
    }}
    onKeyDown={e=>{
      const input=e.currentTarget,start=input.selectionStart ?? 0;
      if(start!==input.selectionEnd || !/^[\d.]+$/.test(value)) return;
      if(e.key==='Backspace' && value[start-1]==='.' && start>1) {
        e.preventDefault();update(value.slice(0,start-2)+value.slice(start),start-2,true);
      } else if(e.key==='Delete' && value[start]==='.') {
        e.preventDefault();update(value.slice(0,start)+value.slice(start+2),start,true);
      }
    }}/></div>;
}
