import {getTranslations} from '@/lib/i18n/server';
import { LoadingAnimation } from './loading-animation';

export async function ViewLoading() {
  const {t}=await getTranslations();
  return <section className="view-loading" role="status" aria-live="polite" aria-busy="true">
    <LoadingAnimation/>
    <span className="sr-only">{t("Loading")}</span>
  </section>;
}
