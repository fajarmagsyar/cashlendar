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
  const reduced=useReducedMotion();
  const playing=!paused && !reduced;
  const day=week.find(item=>item.date===selected)!;
  useLandingMotion(root,playing,replay);
  usePreviewSelection(root,selected,playing);
  return <div ref={root} className="landing" data-animations={playing ? 'playing' : 'paused'}>
    <header className="landing-header">
      <a href="/login" className="landing-brand" aria-label="Cashlendar"><Icon name="calendar" size={26}/>Cashlendar<span className="landing-brand-period">.</span></a>
      <div className="landing-header-actions"><button type="button" className="landing-motion-toggle" aria-label={t(playing ? 'Pause animations' : 'Play animations')} aria-pressed={!playing} disabled={reduced} onClick={()=>setPaused(value=>!value)}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{playing ? <path d="M8 5v14M16 5v14"/> : <path d="m8 5 11 7-11 7V5Z"/>}</svg></button><a href="#how-it-works">{t('How it works')}</a><LanguageSelect/></div>
    </header>
    <main id="main">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-intro">
          <p className="landing-eyebrow">{t('A little less guessing about household money.')}</p>
          <h1 id="landing-title"><span>{t('Today’s spending.')}</span><em>{t('Next month’s plans.')}</em></h1>
          <p className="landing-description">{t('Track the groceries, the bills, and the things you’re saving for. Keep the whole household on the same page.')}</p>
          {error && <div className="notice error-notice" role="alert">{t('Google sign-in did not finish. Try again, or check the OAuth callback configuration.')}</div>}
          <div className="landing-sign-in">
            {configured ? <LoginButton next={next}/> : <div className="setup-notice"><strong>{t('Connect Supabase to get started')}</strong><p>{t('Add your project URL and publishable key to')} <code>.env.local</code>{t(', apply the database migration, and enable Google login.')}</p><p>{t('The setup steps are in')} <code>README.md</code>{t('. After configuring, restart the app.')}</p></div>}
            <p className="landing-login-note">{t('Your own Google login. One shared household.')}</p>
          </div>
          <a href="#how-it-works" className="landing-text-link">{t('See how it works')} <Icon name="arrow" size={18}/></a>
        </div>
        <figure className="landing-preview">
          <figcaption><span>{t('A week at home')}</span><span>{t('Example data')}</span><button className="landing-replay" type="button" aria-label={t('Replay animation')} disabled={!playing} onClick={()=>setReplay(value=>value+1)}><Icon name="reload" size={16}/></button></figcaption>
          <div className="preview-calendar">
            <div className="preview-month"><h2>{t('September 2026')}</h2><Icon name="calendar" size={22}/></div>
            <div className="preview-week" role="group" aria-label={t('A week at home')}>{week.map(day=><button type="button" key={day.date} aria-label={`${t(day.day)} ${day.date}`} aria-pressed={day.date===selected} onClick={()=>setSelected(day.date)} className={`preview-day ${day.date===selected ? 'preview-selected' : ''} ${day.kind==='planned' ? 'preview-planned' : ''}`}>
              <span className="preview-weekday">{t(day.day)}</span><strong>{day.date}</strong>
              {day.label && <span className={`preview-entry ${day.kind}`}><span>{t(day.label)}</span><b>{day.amount}</b>{day.kind==='planned' && <small>{t('Planned')}</small>}</span>}
            </button>)}</div>
            <div className="preview-totals"><div><span>{t('Income')}</span><strong>Rp 7.500.000</strong></div><div><span>{t('Spent')}</span><strong>Rp 770.000</strong></div><span className="preview-currency">IDR</span></div>
          </div>
          <div className="preview-detail" key={selected} aria-live="polite"><span className="preview-detail-date">{day.date}<span>{t(day.day)}</span></span><div><small>{t(day.kind==='planned' ? 'Planned' : 'Recorded')}</small><strong>{t(day.label || 'No transactions on this day.')}</strong></div>{day.amount && <span className={`preview-detail-amount ${day.kind}`}>{day.kind==='income' ? '+Rp ' : day.kind==='expense' ? '−Rp ' : 'Rp '}{day.amount.replace(/^[+−]/,'')}</span>}</div>
          <div className="landing-preview-caption"><p>{t('Choose a day. See the details.')}</p><LandingIllustration variant="record" playing={playing} replay={replay}/></div>
          <p className="preview-footnote"><span className="preview-planned-mark"/>{t('Plan ahead without changing today’s balance.')}</p>
        </figure>
      </section>
      <section id="how-it-works" className="landing-details" aria-labelledby="landing-details-title">
        <div className="landing-section-label"><span>01 /</span><LandingIllustration variant="chart" playing={playing} replay={replay}/><h2 id="landing-details-title">{t('The days tell the story.')}</h2></div>
        <div className="landing-detail-copy"><h3>{t('Put each expense on its day.')}</h3><p>{t('Open a date to see what happened. Switch to a list when you need the details, or a chart when you want the bigger picture.')}</p><figure className="landing-chart-demo"><figcaption><span>{t('Spent this week')}</span><small>{t('Example data')}</small></figcaption><svg viewBox="0 0 440 170" role="img" aria-label={t('Daily expenses for the example week')}><g className="landing-chart-grid" stroke="currentColor" strokeWidth="1"><path d="M36 30H420M36 90H420M36 145H420"/></g><g fill="currentColor" fontSize="10"><text x="0" y="34">350k</text><text x="7" y="94">175k</text><text x="20" y="149">0</text></g><path className="landing-chart-line" pathLength="1" strokeDasharray="1" strokeDashoffset="0" d="M45 66 105 145 165 145 225 30 285 145 345 86 405 145" fill="none" stroke="#a64930" strokeWidth="3" strokeLinejoin="round"/>{[66,145,145,30,145,86,145].map((y,index)=><g key={index}><circle className="landing-chart-dot" cx={45+index*60} cy={y} r="4" fill="#a64930"/><text x={45+index*60} y="167" textAnchor="middle" fontSize="10" fill="currentColor">{t(week[index].day)}</text></g>)}</svg></figure><p className="landing-detail-aside">{t('Set aside the upcoming bills. They become expenses when you mark them paid.')}</p></div>
      </section>
      <section className="landing-savings" aria-labelledby="landing-savings-title">
        <div className="landing-section-label"><span>02 /</span><LandingIllustration variant="savings" playing={playing} replay={replay}/><h2 id="landing-savings-title">{t('Something worth saving for.')}</h2></div>
        <div className="landing-savings-content"><div><h3>{t('Make progress you can see.')}</h3><p>{t('Give a savings account a goal, add money as you go, and see how much is left to reach it.')}</p></div>
          <figure className="preview-savings"><figcaption><Icon name="savings" size={20}/><strong>{t('Rainy-day fund')}</strong><small>{t('Example data')}</small></figcaption><span>{t('Saved so far')}</span><div className="preview-savings-amount">Rp 2.400.000 <small>/ 6.000.000</small></div><progress aria-label={t('Rainy-day fund')} value={40} max={100}/></figure>
        </div>
      </section>
    </main>
    <footer className="landing-footer"><span>Cashlendar.</span><p>{t('Built for everyday rupiah.')}</p><span>{t('Calendar, accounts, and savings. Together.')}</span></footer>
  </div>;
}
