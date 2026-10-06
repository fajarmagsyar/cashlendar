'use client';
import { useEffect,useState,useSyncExternalStore } from 'react';
import { Icon } from './icon';
import { Dialog } from './dialog';
type InstallEvent = Event & { prompt:()=>Promise<void>; userChoice:Promise<{outcome:string}> };
const subscribe = () => () => {};
function isIos() { return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches; }
export function PwaRegistration() {
  useEffect(()=>{
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});
  },[]);
  return null;
}
export function InstallGuidance() {
  const ios = useSyncExternalStore(subscribe,isIos,()=>false);
  const [prompt,setPrompt] = useState<InstallEvent|null>(null),[dismissed,setDismissed] = useState(false),[instructions,setInstructions] = useState(false);
  useEffect(()=>{
    const handle = (event:Event) => {event.preventDefault();setPrompt(event as InstallEvent);};
    const installed = () => {setPrompt(null);setDismissed(true);};
    window.addEventListener('beforeinstallprompt',handle);window.addEventListener('appinstalled',installed);
    return ()=>{window.removeEventListener('beforeinstallprompt',handle);window.removeEventListener('appinstalled',installed);};
  },[]);
  if (dismissed || (!ios && !prompt)) return null;
  return <><button type="button" className="icon-button install-button" aria-label="Install Cashlendar" title="Install Cashlendar" onClick={async()=>{
    if(prompt){try{await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='accepted') setDismissed(true);setPrompt(null);}catch{setInstructions(true);}}
    else setInstructions(true);
  }}><Icon name="download" size={20}/></button>{instructions && <Dialog title="Install Cashlendar" onClose={()=>setInstructions(false)}><p>In Safari, tap Share, then Add to Home Screen.</p></Dialog>}</>;
}
