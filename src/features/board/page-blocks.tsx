'use client';
import {useRef,useState,type PointerEvent} from 'react';
import {useI18n} from '@/components/language-provider';
import {evaluateSheet} from './formulas';
import type {DrawingBlock,TableBlock} from './document';

export function Sheet({block,onChange}:{block:TableBlock;onChange?:(block:TableBlock)=>void}) {
  const {t,locale}=useI18n();const [focused,setFocused]=useState('');
  const values=evaluateSheet(block.cells),columns=block.cells[0].length;
  const label=(r:number,c:number)=>`${String.fromCharCode(65+c)}${r+1}`;
  function change(r:number,c:number,value:string){onChange?.({...block,cells:block.cells.map((row,i)=>i===r ? row.map((cell,j)=>j===c ? value : cell) : row)});}
  function shrink(axis:'row'|'column') {
    const occupied=axis==='row' ? block.cells.at(-1)!.some(Boolean) : block.cells.some(row=>Boolean(row.at(-1)));
    if(occupied && !window.confirm(t('Remove the last row or column and its contents?'))) return;
    onChange?.({...block,cells:axis==='row' ? block.cells.slice(0,-1) : block.cells.map(row=>row.slice(0,-1))});
  }
  return <div className="page-sheet">
    {onChange && <div className="sheet-tools"><button type="button" disabled={block.cells.length>=30} onClick={()=>onChange({...block,cells:[...block.cells,Array(columns).fill('')]})}>{t('Add row')}</button><button type="button" disabled={columns>=12} onClick={()=>onChange({...block,cells:block.cells.map(row=>[...row,''])})}>{t('Add column')}</button><button type="button" disabled={block.cells.length<=1} onClick={()=>shrink('row')}>{t('Remove row')}</button><button type="button" disabled={columns<=1} onClick={()=>shrink('column')}>{t('Remove column')}</button></div>}
    <div className="sheet-scroll" tabIndex={0} role="region" aria-label={t('Table')}><table style={{minWidth:columns*112+38}}><thead><tr><th aria-label={t('Row')}/>{block.cells[0].map((_,c)=><th key={c} scope="col">{String.fromCharCode(65+c)}</th>)}</tr></thead><tbody>{block.cells.map((row,r)=><tr key={r}><th scope="row">{r+1}</th>{row.map((raw,c)=>{
      const result=values[r][c],display=result.error || (typeof result.value==='number' ? new Intl.NumberFormat(locale,{maximumFractionDigits:8}).format(result.value) : result.value);
      return <td key={c} className={result.error ? 'sheet-error' : raw.startsWith('=') ? 'sheet-formula' : ''}>{onChange ? <input aria-label={t('Cell {cell}',{cell:label(r,c)})} maxLength={500} value={focused===label(r,c) ? raw : display} onFocus={()=>setFocused(label(r,c))} onBlur={()=>setFocused('')} onChange={event=>change(r,c,event.target.value)} aria-invalid={Boolean(result.error)} title={raw.startsWith('=') ? raw : undefined}/> : <span title={raw.startsWith('=') ? raw : undefined}>{display || '\u00a0'}</span>}</td>;
    })}</tr>)}</tbody></table></div>
    {onChange && <p className="sheet-help">{t('Start with = to calculate.')} <code>=A1+B1</code> · <code>=SUM(A1:A5)</code><br/>{t('Available: SUM, AVERAGE, MIN, MAX, COUNT. References stay in this table.')}</p>}
  </div>;
}
const colors={ink:'#283b32',green:'#2d7548',red:'#b23b3b',blue:'#326caa'};
export function Drawing({block,onChange,disabled=false}:{block:DrawingBlock;onChange?:(block:DrawingBlock)=>void;disabled?:boolean}) {
  const {t}=useI18n();const [color,setColor]=useState<DrawingBlock['strokes'][number]['color']>('ink');
  const [width,setWidth]=useState(4),[eraser,setEraser]=useState(false);
  const active=useRef<{pointer:number;stroke:DrawingBlock['strokes'][number]}|null>(null),[draft,setDraft]=useState<DrawingBlock['strokes'][number]|null>(null);
  const total=block.strokes.reduce((sum,stroke)=>sum+stroke.points.length,0);
  function position(event:PointerEvent<SVGSVGElement>):[number,number] {
    const bounds=event.currentTarget.getBoundingClientRect();
    return [Math.round(Math.max(0,Math.min(1000,(event.clientX-bounds.left)/bounds.width*1000))),Math.round(Math.max(0,Math.min(600,(event.clientY-bounds.top)/bounds.height*600)))];
  }
  function start(event:PointerEvent<SVGSVGElement>) {
    if(!onChange || disabled || eraser || event.button!==0 || block.strokes.length>=200 || total>=12000) return;
    event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);
    const stroke={id:crypto.randomUUID(),color,width,points:[position(event)]};active.current={pointer:event.pointerId,stroke};setDraft(stroke);
  }
  function move(event:PointerEvent<SVGSVGElement>) {
    const current=active.current;if(!current || current.pointer!==event.pointerId || disabled) return;
    if(current.stroke.points.length>=2000 || current.stroke.points.length+total>=12000) return;
    const point=position(event),last=current.stroke.points.at(-1)!;
    if(Math.hypot(point[0]-last[0],point[1]-last[1])<2) return;
    current.stroke={...current.stroke,points:[...current.stroke.points,point]};setDraft(current.stroke);
  }
  function finish(event:PointerEvent<SVGSVGElement>) {
    const current=active.current;if(!current || current.pointer!==event.pointerId || disabled) return;
    onChange?.({...block,strokes:[...block.strokes,current.stroke]});active.current=null;setDraft(null);
  }
  return <div className="page-drawing">
    {onChange && <div className="drawing-tools" role="group" aria-label={t('Drawing tools')}>
      {(Object.keys(colors) as (keyof typeof colors)[]).map(option=><button key={option} type="button" aria-label={t({ink:'Black pen',green:'Green pen',red:'Red pen',blue:'Blue pen'}[option])} aria-pressed={color===option && !eraser} onClick={()=>{setColor(option);setEraser(false);}}><span style={{background:colors[option]}}/></button>)}
      <label>{t('Pen width')}<select value={width} onChange={event=>setWidth(Number(event.target.value))}>{[2,4,8].map(size=><option key={size} value={size}>{size}</option>)}</select></label>
      <button type="button" aria-pressed={eraser} onClick={()=>setEraser(!eraser)}>{t('Eraser')}</button>
      <button type="button" disabled={!block.strokes.length} onClick={()=>onChange({...block,strokes:block.strokes.slice(0,-1)})}>{t('Undo stroke')}</button>
      <button type="button" disabled={!block.strokes.length} onClick={()=>{if(window.confirm(t('Clear this drawing?'))) onChange({...block,strokes:[]});}}>{t('Clear')}</button>
    </div>}
    <svg className={`drawing-canvas ${onChange ? 'editable' : ''} ${eraser ? 'erasing' : ''}`} viewBox="0 0 1000 600" role="img" aria-label={t('Drawing canvas')} style={{pointerEvents:disabled ? 'none' : undefined}} onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}>
      <title>{t('Drawing canvas')}</title>
      {[...block.strokes,...(draft ? [draft] : [])].map(stroke=>{
        const points=stroke.points.length===1 ? [...stroke.points,[stroke.points[0][0]+0.01,stroke.points[0][1]]] : stroke.points;
        return <polyline key={stroke.id} points={points.map(point=>point.join(',')).join(' ')} fill="none" stroke={colors[stroke.color]} strokeWidth={stroke.width} strokeLinecap="round" strokeLinejoin="round" onPointerDown={onChange && eraser ? event=>{event.stopPropagation();onChange({...block,strokes:block.strokes.filter(s=>s.id!==stroke.id)});} : undefined}/>;
      })}
    </svg>
    {onChange && <small className="muted">{t(eraser ? 'Tap a stroke to erase it.' : 'Draw with your finger, mouse, or pen.')} {total>=12000 || block.strokes.length>=200 ? t('Drawing limit reached. Remove a stroke to continue.') : ''}</small>}
  </div>;
}
