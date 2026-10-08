'use client';

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
  return <div className="landing">
    <header className="landing-header">
      <a href="/login" className="landing-brand" aria-label="Cashlendar"><Icon name="calendar" size={26}/>Cashlendar<span className="landing-brand-period">.</span></a>
      <div className="landing-header-actions"><a href="#how-it-works">{t('How it works')}</a><LanguageSelect/></div>
    </header>
    <main id="main">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-intro">
          <p className="landing-eyebrow">{t('A little less guessing about household money.')}</p>
          <h1 id="landing-title">{t('Today’s spending.')}<br/><em>{t('Next month’s plans.')}</em></h1>
          <p className="landing-description">{t('Track the groceries, the bills, and the things you’re saving for. Keep the whole household on the same page.')}</p>
          {error && <div className="notice error-notice" role="alert">{t('Google sign-in did not finish. Try again, or check the OAuth callback configuration.')}</div>}
          <div className="landing-sign-in">
            {configured ? <LoginButton next={next}/> : <div className="setup-notice"><strong>{t('Connect Supabase to get started')}</strong><p>{t('Add your project URL and publishable key to')} <code>.env.local</code>{t(', apply the database migration, and enable Google login.')}</p><p>{t('The setup steps are in')} <code>README.md</code>{t('. After configuring, restart the app.')}</p></div>}
            <p className="landing-login-note">{t('Your own Google login. One shared household.')}</p>
          </div>
          <a href="#how-it-works" className="landing-text-link">{t('See how it works')} <Icon name="arrow" size={18}/></a>
        </div>
        <figure className="landing-preview">
          <figcaption><span>{t('A week at home')}</span><span>{t('Example data')}</span></figcaption>
          <div className="preview-calendar">
            <div className="preview-month"><h2>{t('September 2026')}</h2><Icon name="calendar" size={22}/></div>
            <div className="preview-week">{week.map(day=><div key={day.date} className={`preview-day ${day.date===21 ? 'preview-selected' : ''} ${day.kind==='planned' ? 'preview-planned' : ''}`}>
              <span className="preview-weekday">{t(day.day)}</span><strong>{day.date}</strong>
              {day.label && <div className={`preview-entry ${day.kind}`}><span>{t(day.label)}</span><b>{day.amount}</b>{day.kind==='planned' && <small>{t('Planned')}</small>}</div>}
            </div>)}</div>
            <div className="preview-totals"><div><span>{t('Income')}</span><strong>Rp 7.500.000</strong></div><div><span>{t('Spent')}</span><strong>Rp 770.000</strong></div><span className="preview-currency">IDR</span></div>
          </div>
          <div className="preview-detail"><span className="preview-detail-date">21<span>{t('Mon')}</span></span><div><small>{t('Recorded')}</small><strong>{t('Groceries')}</strong></div><span className="preview-detail-amount">−Rp 240.000</span></div>
          <p className="preview-footnote"><span className="preview-planned-mark"/>{t('Plan ahead without changing today’s balance.')}</p>
        </figure>
      </section>
      <section id="how-it-works" className="landing-details" aria-labelledby="landing-details-title">
        <div className="landing-section-label"><span>01 /</span><h2 id="landing-details-title">{t('The days tell the story.')}</h2></div>
        <div className="landing-detail-copy"><h3>{t('Put each expense on its day.')}</h3><p>{t('Open a date to see what happened. Switch to a list when you need the details, or a chart when you want the bigger picture.')}</p><p className="landing-detail-aside">{t('Set aside the upcoming bills. They become expenses when you mark them paid.')}</p></div>
      </section>
      <section className="landing-savings" aria-labelledby="landing-savings-title">
        <div className="landing-section-label"><span>02 /</span><h2 id="landing-savings-title">{t('Something worth saving for.')}</h2></div>
        <div className="landing-savings-content"><div><h3>{t('Make progress you can see.')}</h3><p>{t('Give a savings account a goal, add money as you go, and see how much is left to reach it.')}</p></div>
          <figure className="preview-savings"><figcaption><Icon name="savings" size={20}/><strong>{t('Rainy-day fund')}</strong><small>{t('Example data')}</small></figcaption><span>{t('Saved so far')}</span><div className="preview-savings-amount">Rp 2.400.000 <small>/ 6.000.000</small></div><progress aria-label={t('Rainy-day fund')} value={40} max={100}/></figure>
        </div>
      </section>
    </main>
    <footer className="landing-footer"><span>Cashlendar.</span><p>{t('Built for everyday rupiah.')}</p><span>{t('Calendar, accounts, and savings. Together.')}</span></footer>
  </div>;
}
