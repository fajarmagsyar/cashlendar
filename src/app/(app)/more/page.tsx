import Link from '@/components/pending-link';
import {Icon} from '@/components/icon';
import {getTranslations} from '@/lib/i18n/server';

export default async function MorePage() {
  const {t}=await getTranslations();
  return <><div className="page-heading"><h1>{t('More')}</h1></div><p className="muted">{t('A few useful tools for your family.')}</p>
    <section className="tools-grid" aria-label={t('Family tools')}>
      <Link href="/savings" className="tool-link"><Icon name="savings" size={28}/><div><h2>{t('Savings')}</h2><p>{t('Put money aside for things you are planning together.')}</p></div><Icon name="right"/></Link>
      <Link href="/board" className="tool-link"><Icon name="board" size={28}/><div><h2>{t('Fridge Notes')}</h2><p>{t('Notes and reminders for everyone.')}</p></div><Icon name="right"/></Link>
    </section></>;
}
