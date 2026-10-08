import {getTranslations} from '@/lib/i18n/server';
import Link from 'next/link';
export default async function NotFound() {
  const {t}=await getTranslations(); return <main id="main" className="loading-page"><h1>{t("This page isn’t here.")}</h1><Link className="button primary" href="/">{t("Back to Calendar")}</Link></main>; }
