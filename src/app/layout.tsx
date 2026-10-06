import type { Metadata, Viewport } from 'next';
import { PwaRegistration, InstallGuidance } from '@/components/pwa';
import './globals.css';
export const metadata: Metadata = {
  title: { default:'Cashlendar',template:'%s · Cashlendar' }, description:'Your household money, one day at a time.',
  applicationName:'Cashlendar', appleWebApp:{ capable:true,statusBarStyle:'default',title:'Cashlendar' },
  icons:{ icon:'/icons/icon-192.png',apple:'/icons/apple-touch-icon.png' }
};
export const viewport: Viewport = { themeColor:'#174f3e',width:'device-width',initialScale:1 };
export default function RootLayout({ children }: { children:React.ReactNode }) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a>{children}<PwaRegistration/><InstallGuidance/></body></html>;
}
