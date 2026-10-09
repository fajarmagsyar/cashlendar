'use client';

import {useEffect,useRef,useSyncExternalStore,type RefObject} from 'react';
import type {AnimationItem} from 'lottie-web';
import record from '@/animations/landing-record.json';
import savings from '@/animations/landing-savings.json';
import chart from '@/animations/landing-chart.json';

const assets={record,savings,chart};
const motionQuery='(prefers-reduced-motion: reduce)';
const subscribe=(callback:()=>void)=>{
  const query=window.matchMedia(motionQuery);
  query.addEventListener('change',callback);
  return ()=>query.removeEventListener('change',callback);
};
export function useReducedMotion(){return useSyncExternalStore(subscribe,()=>window.matchMedia(motionQuery).matches,()=>true);}

export function LandingIllustration({variant,playing,replay}:{variant:keyof typeof assets;playing:boolean;replay:number}) {
  const container=useRef<HTMLSpanElement>(null);
  const player=useRef<AnimationItem|null>(null);
  const active=useRef(playing);
  const visible=useRef(false);
  useEffect(()=>{
    active.current=playing;
    if(!playing) player.current?.goToAndStop(179,true);
    else {
      player.current?.goToAndStop(0,true);
      if(visible.current && !document.hidden) player.current?.play();
    }
  },[playing]);
  useEffect(()=>{
    let disposed=false;
    let observer:IntersectionObserver|undefined;
    function update(){if(visible.current && active.current && !document.hidden) player.current?.play();else player.current?.pause();}
    const element=container.current;
    if(!element) return;
    void import('lottie-web/build/player/lottie_light').then(({default:lottie})=>{
      if(disposed) return;
      const animation=lottie.loadAnimation({container:element,renderer:'svg',loop:false,autoplay:false,animationData:structuredClone(assets[variant])});
      player.current=animation;
      animation.addEventListener('DOMLoaded',()=>{if(!active.current) animation.goToAndStop(179,true);update();});
      observer=new IntersectionObserver(entries=>{visible.current=entries[0].isIntersecting;update();},{threshold:.2});
      observer.observe(element);
    }).catch(()=>{element.dataset.fallback='true';});
    document.addEventListener('visibilitychange',update);
    return ()=>{disposed=true;observer?.disconnect();document.removeEventListener('visibilitychange',update);player.current?.destroy();player.current=null;};
  },[variant,replay]);
  return <span ref={container} className={`landing-lottie landing-lottie-${variant}`} aria-hidden="true"><svg className="landing-lottie-fallback" viewBox="0 0 160 160" fill="none" stroke="currentColor" strokeWidth="4"><rect x="35" y="30" width="90" height="105" rx="12"/><path d="m53 85 18 18 37-42"/></svg></span>;
}

export function useLandingMotion(root:RefObject<HTMLDivElement|null>,playing:boolean,replay:number) {
  useEffect(()=>{
    let disposed=false;
    let context:gsap.Context|undefined;
    let removeVisibility:(()=>void)|undefined;
    const element=root.current;
    if(!element || !playing) return;
    let removePointer:(()=>void)|undefined;
    const preview=element.querySelector('.landing-preview');
    void import('gsap').then(({gsap})=>{
      if(disposed) return;
      context=gsap.context(()=>{
        preview?.setAttribute('inert','');
        const entrance=gsap.timeline({defaults:{ease:'power3.out'}});
        entrance.from('.landing-header',{y:-12,opacity:0,duration:.7})
          .from('.landing-intro h1>*',{y:38,opacity:0,duration:1,stagger:.16},.15)
          .from('.landing-subtitle,.landing-sign-in,.landing-product-line',{y:16,opacity:0,duration:.7,stagger:.12},.65)
          .from('.landing-orbit-path',{strokeDashoffset:1,duration:2.5,ease:'power2.inOut'},.25)
          .from('.landing-preview',{rotation:-9,y:75,opacity:0,duration:1.4},.4)
          .from('.preview-day',{y:12,opacity:0,stagger:.075,duration:.5},1)
          .from('.preview-entry',{scaleX:0,transformOrigin:'left',stagger:.1,duration:.6},1.5)
          .from('.preview-detail',{x:22,opacity:0,duration:.7},1.8)
          .from('.landing-chart-float',{x:-48,y:25,rotation:-8,opacity:0,duration:1.1},.9)
          .from('.landing-savings-float',{x:36,y:48,rotation:11,opacity:0,duration:1.1},1.4)
          .from('.landing-chart-line',{strokeDashoffset:1,duration:1.8,ease:'power2.inOut'},1.7)
          .from('.landing-chart-dot',{scale:0,transformOrigin:'center',stagger:.08,duration:.4},2.5)
          .from('.preview-savings progress',{attr:{value:0},duration:1.8,ease:'power2.inOut'},2)
          .from('.landing-footer',{opacity:0,duration:.7},1.3)
          .call(()=>preview?.removeAttribute('inert'),[],2.1);
        gsap.to('.landing-chart-float',{y:-7,rotation:2,duration:3.5,yoyo:true,repeat:3,delay:3,ease:'sine.inOut'});
        gsap.to('.landing-savings-float',{y:7,rotation:1,duration:4,yoyo:true,repeat:3,delay:3,ease:'sine.inOut'});
        const assembly=element.querySelector('.landing-orbit');
        const art=element.querySelector('.landing-art');
        if(assembly && art) {
          const x=gsap.quickTo(assembly,'y',{duration:.8,ease:'power3.out'});
          const y=gsap.quickTo(assembly,'x',{duration:.8,ease:'power3.out'});
          const move=(event:Event)=>{
            const pointer=event as PointerEvent;
            if(pointer.pointerType!=='mouse') return;
            const rect=art.getBoundingClientRect();
            x(-((pointer.clientY-rect.top)/rect.height-.5)*12);
            y(((pointer.clientX-rect.left)/rect.width-.5)*16);
          };
          const reset=()=>{x(0);y(0);};
          art.addEventListener('pointermove',move,{passive:true});
          art.addEventListener('pointerleave',reset);
          removePointer=()=>{art.removeEventListener('pointermove',move);art.removeEventListener('pointerleave',reset);};
        }
      },element);
      element.dataset.motionReady='true';
      const visibility=()=>context?.getTweens().forEach((tween:gsap.core.Tween)=>document.hidden ? tween.pause() : tween.resume());
      document.addEventListener('visibilitychange',visibility);
      removeVisibility=()=>document.removeEventListener('visibilitychange',visibility);
    }).catch(()=>{element.dataset.motionReady='fallback';});
    return ()=>{disposed=true;removePointer?.();removeVisibility?.();context?.revert();preview?.removeAttribute('inert');delete element.dataset.motionReady;};
  },[root,playing,replay]);
}


export function usePreviewSelection(root:RefObject<HTMLDivElement|null>,selected:number,playing:boolean) {
  const previous=useRef(selected);
  useEffect(()=>{
    if(previous.current===selected) return;
    previous.current=selected;
    if(!playing) return;
    let disposed=false;
    let tween:gsap.core.Tween|undefined;
    void import('gsap').then(({gsap})=>{
      const detail=root.current?.querySelector('.preview-detail');
      if(!disposed && detail) tween=gsap.fromTo(detail,{y:12,opacity:0},{y:0,opacity:1,duration:.35,ease:'power2.out'});
    });
    return ()=>{disposed=true;tween?.revert();};
  },[root,selected,playing]);
}
