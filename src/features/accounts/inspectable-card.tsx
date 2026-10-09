'use client';
import {useRef,useState,type ReactNode,type PointerEvent} from 'react';
import {useI18n} from '@/components/language-provider';
import {Icon} from '@/components/icon';

export function InspectableCard({children,className,name,details,actions}:{children:ReactNode;className:string;name:string;details:ReactNode;actions:ReactNode}) {
  const {t}=useI18n();
  const card=useRef<HTMLDivElement>(null);
  const drag=useRef<{id:number;x:number;y:number}|null>(null);
  const [flipped,setFlipped]=useState(false);
  function reset() {
    card.current?.style.setProperty('--tilt-x','0deg');
    card.current?.style.setProperty('--tilt-y','0deg');
    card.current?.classList.remove('is-dragging');
  }
  function move(event:PointerEvent<HTMLDivElement>) {
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if(!drag.current && event.pointerType==='touch') return;
    const rect=event.currentTarget.getBoundingClientRect();
    const x=(event.clientX-rect.left)/rect.width;
    const y=(event.clientY-rect.top)/rect.height;
    const dx=drag.current ? (event.clientX-drag.current.x)*.4 : (x-.5)*30;
    const dy=drag.current ? -(event.clientY-drag.current.y)*.4 : -(y-.5)*24;
    card.current?.style.setProperty('--tilt-x',`${Math.max(-24,Math.min(24,dy))}deg`);
    card.current?.style.setProperty('--tilt-y',`${Math.max(-28,Math.min(28,dx))}deg`);
    card.current?.style.setProperty('--light-x',`${Math.max(0,Math.min(100,x*100))}%`);
    card.current?.style.setProperty('--light-y',`${Math.max(0,Math.min(100,y*100))}%`);
  }
  function finish(event:PointerEvent<HTMLDivElement>) {
    const start=drag.current;
    if(!start || start.id!==event.pointerId) return;
    const dx=event.clientX-start.x,dy=event.clientY-start.y;
    if(event.type!=='pointercancel' && Math.abs(dx)>55 && Math.abs(dx)>Math.abs(dy)*1.2) setFlipped(value=>!value);
    drag.current=null;
    if(event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    reset();
  }
  return <article className="card-inspector">
    <div className="card-stage" onPointerDown={event=>{
      if((event.target as HTMLElement).closest('button') || event.button!==0) return;
      drag.current={id:event.pointerId,x:event.clientX,y:event.clientY};
      event.currentTarget.setPointerCapture(event.pointerId);
      card.current?.classList.add('is-dragging');
    }} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={()=>{drag.current=null;reset();}} onPointerLeave={()=>{if(!drag.current) reset();}}>
      <div ref={card} className={`card-rotator ${flipped ? 'is-flipped' : ''}`}>
        <div className="card-edge" aria-hidden="true"/>
        <div className={`${className} card-front`} inert={flipped}>{children}<button className="card-flip" aria-label={t('Inspect {name}',{name})} onClick={()=>{reset();setFlipped(true);}}><Icon name="reload" size={17}/></button></div>
        <div className={`${className} card-back`} inert={!flipped}><div className="card-magnetic-strip" aria-hidden="true"/><div className="card-signature"><h2>{name}</h2><span>Cashlendar</span></div><div className="card-back-balance">{details}</div><button className="card-flip" aria-label={t('Turn card over')} onClick={()=>{reset();setFlipped(false);}}><Icon name="reload" size={17}/></button></div>
      </div>
    </div>
    <div className="card-inspector-actions">{actions}</div>
  </article>;
}
