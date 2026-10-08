import {LanguageProvider} from '@/components/language-provider';
import {getTranslations} from '@/lib/i18n/server';
import type { Metadata, Viewport } from 'next';
import { PwaRegistration } from '@/components/pwa';
import './globals.css';
import '@/components/pickers.css';
const baseMetadata: Metadata = {
  title: { default:'Cashlendar',template:'%s · Cashlendar' }, description:'Your household money, one day at a time.',
  applicationName:'Cashlendar', appleWebApp:{ capable:true,statusBarStyle:'default',title:'Cashlendar' },
  icons:{ icon:'/icons/icon-192.png',apple:'/icons/apple-touch-icon.png' }
};
export async function generateMetadata():Promise<Metadata> {const {t}=await getTranslations();return {...baseMetadata,description:t('Your household money, one day at a time.')};}
export const viewport: Viewport = { themeColor:'#174f3e',width:'device-width',initialScale:1,viewportFit:'cover' };
export default async function RootLayout({ children }: { children:React.ReactNode }) {
  const {t,locale}=await getTranslations();
  return <html lang={locale}><body><LanguageProvider initialLocale={locale}><a className="skip-link" href="#main">{t("Skip to content")}</a>{children}<PwaRegistration/></LanguageProvider></body></html>;
}
