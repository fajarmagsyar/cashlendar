'use client';
import {useEffect,useState} from 'react';
import {useI18n} from '@/components/language-provider';
import {Icon} from '@/components/icon';
import {savePushSubscription,removePushSubscription,hasPushSubscription} from './push-actions';

export function PhoneNotifications({configured}:{configured:boolean}) {
  const {t,locale}=useI18n();
  const [enabled,setEnabled]=useState(false),[pending,setPending]=useState(false),[error,setError]=useState('');
  const [support,setSupport]=useState<'checking'|'supported'|'ios'|'unsupported'>('checking');
  useEffect(()=>{
    let active=true;
    async function check() {
      const ios=/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches;
      if(ios) {if(active) setSupport('ios');return;}
      if(!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {if(active) setSupport('unsupported');return;}
      if(active) setSupport('supported');
      const registration=await navigator.serviceWorker.getRegistration('/');
      const existing=await registration?.pushManager.getSubscription();
      if(existing && configured && await hasPushSubscription(existing.endpoint)) {
        const result=await savePushSubscription(existing.toJSON(),locale);
        if(active) setEnabled(result.ok);
      }
    }
    check().catch(()=>{if(active) setError('Could not check notifications. Please try again.');});
    return ()=>{active=false;};
  },[configured,locale]);
  async function toggle() {
    if(pending) return;
    setPending(true);setError('');
    try {
      if(!enabled) {
        // Ask during the tap handler; Safari requires a direct user gesture.
        if(await Notification.requestPermission()!=='granted') {setError('Allow notifications in your browser settings to receive reminders.');return;}
      }
      const registration=await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const existing=await registration.pushManager.getSubscription();
      if(enabled && existing) {
        const result=await removePushSubscription(existing.endpoint);
        if(!result.ok) {setError(result.error);return;}
        await existing.unsubscribe();setEnabled(false);
      }else{
        const key=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
        const raw=atob(key.replace(/-/g,'+').replace(/_/g,'/'));
        const applicationServerKey=Uint8Array.from(raw,char=>char.charCodeAt(0));
        const value=existing || await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey});
        const result=await savePushSubscription(value.toJSON(),locale);
        if(!result.ok) {setError(result.error);return;}
        setEnabled(true);
      }
    }catch{setError('Could not enable notifications. Please try again.');}
    finally{setPending(false);}
  }
  const hint=!configured ? 'Phone notifications are not set up yet.' : support==='ios' ? 'Add Cashlendar to your Home Screen to enable reminders.' : support==='unsupported' ? 'This browser does not support phone notifications.' : enabled ? 'Reminders will appear on this phone.' : 'Receive a notification when a reminder is due.';
  return <details className="phone-notifications" aria-label={t('Phone reminders')}><summary><Icon name="bell"/>{t('Phone reminders')}<span>{t(enabled ? 'On' : 'Off')}</span></summary><div><small>{t(hint)}</small>{error && <p role="alert" className="error-text">{t(error)}</p>}
    {configured && support==='supported' && <button className="button secondary" disabled={pending} onClick={toggle}>{t(pending ? 'Saving…' : enabled ? 'Disable notifications' : 'Enable notifications')}</button>}
  </div></details>;
}
