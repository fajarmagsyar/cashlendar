import Link from '@/components/pending-link';
import {Icon} from '@/components/icon';
export default function Settings() {
  return <><Link className="text-button profile-back" href="/profile" aria-label="Back to profile"><Icon name="left" size={18}/>Profile</Link><div className="page-heading"><h1>Settings</h1></div>
    <section className="panel settings-panel" aria-label="Preferences">
      <div className="setting-row"><div className="setting-label"><label htmlFor="setting-language">Language</label><span id="language-soon" className="soon-badge">Soon</span></div><select id="setting-language" aria-describedby="language-soon" value="en" disabled><option value="en">English</option></select></div>
      <div className="setting-row"><div className="setting-label"><label htmlFor="setting-currency">Currency</label><span id="currency-soon" className="soon-badge">Soon</span></div><select id="setting-currency" aria-describedby="currency-soon" value="IDR" disabled><option value="IDR">Indonesian rupiah (IDR)</option></select></div>
    </section>
  </>;
}
