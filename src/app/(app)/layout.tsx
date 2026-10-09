import {getTranslations} from '@/lib/i18n/server';
import Link from '@/components/pending-link';
import {getAccounts,getCategories} from '@/features/finance/queries';
import { Navigation } from '@/components/navigation';
import { Icon } from '@/components/icon';
import { InstallGuidance } from '@/components/pwa';
import { requireHousehold } from '@/lib/supabase/server';
import {getProfile} from '@/features/profile/queries';
import { SaveFeedbackProvider } from '@/components/save-feedback';
import {PageTransition} from '@/components/page-transition';
export const dynamic='force-dynamic';
export default async function AppLayout({children}:{children:React.ReactNode}) {
  const {t}=await getTranslations();
  const [{household},accounts,categories,profile]=await Promise.all([requireHousehold(),getAccounts(),getCategories(),getProfile()]);
  const display=profile.display_name;
  return <SaveFeedbackProvider><div className="app-shell">
    <header className="app-header"><Link href="/" className="brand"><span className="brand-symbol"><Icon name="calendar" size={22}/></span>Cashlendar</Link>
      <span className="header-household">{household.name}</span><Link href="/profile" aria-label={t("Open profile")} className="header-user profile-header-link"><span className="avatar" aria-hidden="true">{display.slice(0,1).toUpperCase()}</span><span>{display}</span></Link>
      <InstallGuidance/>
    </header>
    <Navigation accounts={accounts} categories={categories}/>
    <div className="app-content"><main id="main"><PageTransition>{children}</PageTransition></main></div>
  </div></SaveFeedbackProvider>;
}
