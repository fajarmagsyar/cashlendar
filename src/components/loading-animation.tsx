'use client';

import {useEffect,useRef} from 'react';
import type {AnimationItem} from 'lottie-web';
import animationData from '@/animations/loading.json';

export function LoadingAnimation() {
  const container=useRef<HTMLSpanElement>(null);
  useEffect(()=>{
    let disposed=false;
    let animation:AnimationItem | undefined;
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion=()=>{
      if(motion.matches) animation?.goToAndStop(0,true);
      else animation?.play();
    };
    void import('lottie-web/build/player/lottie_light').then(({default:lottie})=>{
      if(disposed || !container.current) return;
      animation=lottie.loadAnimation({container:container.current,renderer:'svg',loop:true,autoplay:!motion.matches,animationData});
      updateMotion();
    }).catch(()=>{/* The inline ring remains visible if the player cannot load. */});
    motion.addEventListener('change',updateMotion);
    return ()=>{disposed=true;motion.removeEventListener('change',updateMotion);animation?.destroy();};
  },[]);
  return <span className="loading-animation" aria-hidden="true">
    <span ref={container} className="loading-animation-player"/>
    <svg className="loading-animation-fallback" viewBox="0 0 64 64"><circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="100 138"/></svg>
  </span>;
}
