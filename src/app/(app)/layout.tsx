import Link from 'next/link';
import {getAccounts,getCategories} from '@/features/finance/queries';
import { Navigation } from '@/components/navigation';
import { Icon } from '@/components/icon';
import { InstallGuidance } from '@/components/pwa';
import { requireHousehold } from '@/lib/supabase/server';
import { signOut } from '@/features/household/actions';
export const dynamic='force-dynamic';
export default async function AppLayout({children}:{children:React.ReactNode}) {
  const {household,user}=await requireHousehold();
  const [accounts,categories]=await Promise.all([getAccounts(),getCategories()]);
  const display=user.user_metadata.full_name || user.email || 'Family member';
  return <div className="app-shell">
    <header className="app-header"><Link href="/" className="brand"><span className="brand-symbol"><Icon name="calendar" size={22}/></span>Cashlendar</Link>
      <span className="header-household">{household.name}</span><div className="header-user"><span className="avatar" aria-hidden="true">{display.slice(0,1).toUpperCase()}</span><span>{display}</span></div>
      <InstallGuidance/><form action={signOut}><button className="icon-button" aria-label="Sign out"><Icon name="logout" size={20}/></button></form>
    </header>
    <Navigation accounts={accounts} categories={categories}/>
    <div className="app-content"><main id="main">{children}</main></div>
  </div>;
}
