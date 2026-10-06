'use client';
import { useEffect,useState,useSyncExternalStore } from 'react';
import { Icon } from './icon';
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
  return <aside className="install-tip" aria-label="Install Cashlendar"><button className="text-button" onClick={async()=>{if(prompt){await prompt.prompt();await prompt.userChoice;setPrompt(null);}else setInstructions(true);}}><Icon name="download" size={18}/>Install Cashlendar</button>{instructions && <p>In Safari, tap Share, then “Add to Home Screen”.</p>}<button className="icon-button" aria-label="Dismiss installation tip" onClick={()=>setDismissed(true)}><Icon name="close" size={16}/></button></aside>;
}
