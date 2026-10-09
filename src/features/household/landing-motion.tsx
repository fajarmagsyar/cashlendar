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
    void Promise.all([import('gsap'),import('gsap/ScrollTrigger')]).then(([{gsap},{ScrollTrigger}])=>{
      if(disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      context=gsap.context(()=>{
        const entrance=gsap.timeline({defaults:{ease:'power3.out'}});
        entrance.from('.landing-intro > :not(.landing-sign-in)',{y:26,opacity:0,duration:.8,stagger:.12})
          .from('.landing-sign-in',{opacity:0,y:14,duration:.6},.5)
          .from('.landing-preview',{rotationX:9,rotationY:-9,y:45,opacity:0,duration:1.2},.2)
          .from('.preview-day',{y:14,opacity:0,stagger:.08,duration:.5},.65)
          .from('.preview-entry',{scale:.85,opacity:0,stagger:.22,duration:.55},1.3)
          .from('.preview-detail',{x:32,opacity:0,duration:.7},2.2)
          .from('.landing-preview .landing-lottie',{scale:.7,opacity:0,duration:.7},2.1);
        for(const section of element.querySelectorAll('.landing-details,.landing-savings')) {
          gsap.from(section.querySelectorAll('.landing-section-label,.landing-detail-copy,.landing-savings-content'),{y:36,opacity:0,duration:.9,stagger:.16,scrollTrigger:{trigger:section,start:'top 85%',once:true}});
        }
        gsap.from('.landing-chart-line',{strokeDashoffset:1,duration:1.8,ease:'power2.inOut',scrollTrigger:{trigger:'.landing-chart-demo',start:'top 85%',once:true}});
        gsap.from('.landing-chart-dot',{scale:0,transformOrigin:'center',stagger:.12,duration:.4,scrollTrigger:{trigger:'.landing-chart-demo',start:'top 75%',once:true}});
        gsap.from('.preview-savings progress',{attr:{value:0},duration:2,ease:'power2.inOut',scrollTrigger:{trigger:'.preview-savings',start:'top 85%',once:true}});
      },element);
      element.dataset.motionReady='true';
      const visibility=()=>context?.getTweens().forEach((tween:gsap.core.Tween)=>document.hidden ? tween.pause() : tween.resume());
      document.addEventListener('visibilitychange',visibility);
      removeVisibility=()=>document.removeEventListener('visibilitychange',visibility);
    }).catch(()=>{element.dataset.motionReady='fallback';});
    return ()=>{disposed=true;removeVisibility?.();context?.revert();delete element.dataset.motionReady;};
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
