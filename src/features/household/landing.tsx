'use client';

import {useRef,useState} from 'react';
import {LandingIllustration,useLandingMotion,useReducedMotion,usePreviewSelection} from './landing-motion';
import './landing-motion.css';
import {LanguageSelect,useI18n} from '@/components/language-provider';
import {Icon} from '@/components/icon';
import {LoginButton} from './login-button';

const week=[
  {date:21,day:'Mon',label:'Groceries',amount:'−240.000',kind:'expense'},
  {date:22,day:'Tue',label:'Salary',amount:'+7.500.000',kind:'income'},
  {date:23,day:'Wed'},
  {date:24,day:'Thu',label:'Electricity',amount:'−350.000',kind:'expense'},
  {date:25,day:'Fri'},
  {date:26,day:'Sat',label:'Dinner out',amount:'−180.000',kind:'expense'},
  {date:27,day:'Sun',label:'Next rent payment',amount:'2.500.000',kind:'planned'}
];

export function Landing({configured,next,error}:{configured:boolean;next:string;error:boolean}) {
  const {t}=useI18n();
  const root=useRef<HTMLDivElement>(null);
  const [paused,setPaused]=useState(false),[replay,setReplay]=useState(0),[selected,setSelected]=useState(21);
  const reduced=useReducedMotion(),playing=!paused && !reduced;
  const day=week.find(item=>item.date===selected)!;
  useLandingMotion(root,playing,replay);
  usePreviewSelection(root,selected,playing);
  return <div ref={root} className="landing landing--studio" data-animations={playing ? 'playing' : 'paused'}>
    <header className="landing-header">
      <a href="/login" className="landing-brand" aria-label="Cashlendar"><span className="landing-logo"><Icon name="calendar" size={20}/></span>Cashlendar</a>
      <div className="landing-header-actions">
        <button type="button" className="landing-motion-toggle" aria-label={t(playing ? 'Pause animations' : 'Play animations')} aria-pressed={!playing} disabled={reduced} onClick={()=>setPaused(value=>!value)}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{playing ? <path d="M8 5v14M16 5v14"/> : <path d="m8 5 11 7-11 7V5Z"/>}</svg></button>
        <LanguageSelect/>
      </div>
    </header>
    <main id="main" className="landing-main">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-intro">
          <h1 id="landing-title"><span>{t('Your money.')}</span><em>{t('Day by day.')}</em></h1>
          <p className="landing-subtitle">{t('A shared calendar for your household’s money.')}</p>
          {error && <div className="notice error-notice" role="alert">{t('Google sign-in did not finish. Try again, or check the OAuth callback configuration.')}</div>}
          <div className="landing-sign-in">{configured ? <LoginButton next={next}/> : <div className="setup-notice"><strong>{t('Connect Supabase to get started')}</strong></div>}</div>
          <div className="landing-product-line"><span><Icon name="calendar" size={14}/>{t('Calendar')}</span><span><Icon name="wallet" size={14}/>{t('Accounts')}</span><span><Icon name="savings" size={14}/>{t('Savings')}</span></div>
        </div>
        <div className="landing-art" aria-label={t('Example data')}>
          <svg className="landing-orbit" viewBox="0 0 640 600" fill="none" aria-hidden="true"><path className="landing-orbit-path" pathLength="1" strokeDasharray="1" d="M75 440C-30 230 145 20 356 51S707 319 528 498 112 607 75 440Z"/><path d="M91 430C14 224 151 66 350 78S642 321 516 466 159 551 91 430Z"/></svg>
          <div className="landing-assembly">
            <figure className="landing-preview">
              <div className="preview-calendar">
                <div className="preview-month"><div><span className="preview-month-label">{t('Calendar')}</span><h2>{t('September 2026')}</h2></div><button className="landing-replay" type="button" aria-label={t('Replay animation')} disabled={!playing} onClick={()=>setReplay(value=>value+1)}><Icon name="reload" size={16}/></button></div>
                <div className="preview-week" role="group" aria-label={t('A week at home')}>{week.map(day=><button type="button" key={day.date} aria-label={`${t(day.day)} ${day.date}`} aria-pressed={day.date===selected} onClick={()=>setSelected(day.date)} className={`preview-day ${day.date===selected ? 'preview-selected' : ''} ${day.kind==='planned' ? 'preview-planned' : ''}`}><span className="preview-weekday">{t(day.day)}</span><strong>{day.date}</strong><span className={`preview-entry ${day.kind || 'empty'}`} aria-hidden="true"><i/><i/></span></button>)}</div>
                <div className="preview-detail" key={selected} aria-live="polite"><LandingIllustration variant="record" playing={playing} replay={replay}/><div>{day.kind==='planned' && <small>{t('Planned')}</small>}<strong>{t(day.label || 'No transactions on this day.')}</strong><small>{day.date} {t('September')}</small></div>{day.amount && <span className={`preview-detail-amount ${day.kind}`}>{day.kind==='income' ? '+Rp ' : day.kind==='expense' ? '−Rp ' : 'Rp '}{day.amount.replace(/^[+−]/,'')}</span>}</div>
                <div className="preview-totals"><div><span>{t('Income')}</span><strong>Rp 7.500.000</strong></div><div><span>{t('Spent')}</span><strong>Rp 770.000</strong></div></div>
              </div>
              <figcaption>{t('Example data')}</figcaption>
            </figure>
            <div className="landing-chart-float"><figure className="landing-chart-demo"><figcaption><span>{t('Spent this week')}</span><LandingIllustration variant="chart" playing={playing} replay={replay}/></figcaption><strong>Rp 770.000</strong><svg viewBox="0 0 220 64" role="img" aria-label={t('Daily expenses for the example week')}><path d="M4 62H216" stroke="#dfd8ca"/><path className="landing-chart-line" pathLength="1" strokeDasharray="1" d="M5 24 40 60 75 60 110 5 145 60 180 32 215 60" fill="none" stroke="#b47841" strokeWidth="2.5" strokeLinejoin="round"/>{[24,60,60,5,60,32,60].map((y,index)=><circle className="landing-chart-dot" key={index} cx={5+index*35} cy={y} r="2.5" fill="#b47841"/>)}</svg></figure></div>
            <div className="landing-savings-float landing-savings"><figure className="preview-savings"><figcaption><span>{t('Rainy-day fund')}</span><LandingIllustration variant="savings" playing={playing} replay={replay}/></figcaption><div className="preview-savings-amount">Rp 2.400.000 <small>/ 6.000.000</small></div><progress aria-label={t('Rainy-day fund')} value={40} max={100}/></figure></div>
          </div>
        </div>
      </section>
    </main>
    <footer className="landing-footer"><span>{t('Built for everyday rupiah.')}</span><span>Cashlendar © {new Date().getFullYear()}</span></footer>
  </div>;
}
