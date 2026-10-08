'use client';
import {useI18n} from '@/components/language-provider';

export default function ErrorPage({ reset }: { reset:()=>void }) {
  const {t}=useI18n();
  return <main id="main" className="loading-page"><h1>{t("We couldn’t load this page.")}</h1><p>{t("Please check your connection and try again. If this persists, check your Supabase setup.")}</p><button className="button primary" onClick={reset}>{t("Try again")}</button></main>;
}
