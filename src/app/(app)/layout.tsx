import Link from 'next/link';
import { Navigation } from '@/components/navigation';
import { Icon } from '@/components/icon';
import { requireHousehold } from '@/lib/supabase/server';
import { signOut } from '@/features/household/actions';
export const dynamic = 'force-dynamic';
export default async function AppLayout({ children }: { children:React.ReactNode }) {
  const { household,user } = await requireHousehold();
  const display = user.user_metadata.full_name || user.email || 'Family member';
  return <div className="app-shell">
    <aside className="sidebar">
      <Link href="/" className="brand"><span className="brand-symbol"><Icon name="calendar" size={24}/></span>Cashlendar<span className="brand-dot">.</span></Link>
      <div className="household-label"><span className="small-label">YOUR HOUSEHOLD</span><strong>{household.name}</strong><span>Shared money, clearer days.</span></div>
      <Navigation/>
      <div className="sidebar-bottom"><div className="user"><span className="avatar">{display.slice(0,1).toUpperCase()}</span><div><strong>{display}</strong><small>Household member</small></div></div><form action={signOut}><button className="text-button"><Icon name="logout" size={18}/>Sign out</button></form></div>
    </aside>
    <div className="app-content"><header className="mobile-header"><Link href="/" className="brand"><Icon name="calendar"/>Cashlendar.</Link><Link className="text-button" href="/accounts">Accounts</Link><Link className="text-button" href="/family">Family</Link><form action={signOut}><button className="text-button" aria-label="Sign out"><Icon name="logout"/></button></form></header><main id="main">{children}</main><footer className="app-footer"><span>Made for your everyday money.</span><span>IDR · Asia/Jakarta</span></footer></div>
  </div>;
}
