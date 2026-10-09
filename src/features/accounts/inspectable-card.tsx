'use client';
import {useRef,useState,type ReactNode} from 'react';
import {useI18n} from '@/components/language-provider';
import {Icon} from '@/components/icon';

export function InspectableCard({children,className,name,details,actions}:{children:ReactNode;className:string;name:string;details:ReactNode;actions:ReactNode}) {
  const {t}=useI18n(),card=useRef<HTMLDivElement>(null),[flipped,setFlipped]=useState(false);
  function reset() {card.current?.style.setProperty('--tilt-x','0deg');card.current?.style.setProperty('--tilt-y','0deg');}
  return <article className="card-inspector" onPointerMove={event=>{
    if(event.pointerType==='touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect=event.currentTarget.getBoundingClientRect();
    card.current?.style.setProperty('--tilt-x',`${-(event.clientY-rect.top-rect.height/2)/rect.height*16}deg`);
    card.current?.style.setProperty('--tilt-y',`${(event.clientX-rect.left-rect.width/2)/rect.width*20}deg`);
  }} onPointerLeave={reset}>
    <div ref={card} className={`card-rotator ${flipped ? 'is-flipped' : ''}`}>
      <div className={`${className} card-front`} inert={flipped}>{children}<button className="card-flip" aria-label={t('Inspect {name}',{name})} onClick={()=>{reset();setFlipped(true);}}><Icon name="reload" size={18}/><span>{t('Inspect card')}</span></button></div>
      <div className={`${className} card-back`} inert={!flipped}><div className="card-magnetic-strip" aria-hidden="true"/><h2>{name}</h2>{details}<button className="card-flip" onClick={()=>{reset();setFlipped(false);}}><Icon name="reload" size={18}/>{t('Turn card over')}</button></div>
    </div>
    <div className="card-inspector-actions">{actions}</div>
  </article>;
}
