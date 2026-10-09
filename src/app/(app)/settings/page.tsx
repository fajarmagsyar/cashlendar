import {LanguageSelect} from '@/components/language-provider';
import {getTranslations} from '@/lib/i18n/server';
import Link from '@/components/pending-link';
import {Icon} from '@/components/icon';
import {getCategories} from '@/features/finance/queries';
import {CategoryButton,ArchiveButton} from '@/features/accounts/account-controls';
export default async function Settings() {
  const {t}=await getTranslations();
  const categories=await getCategories();
  return <><Link className="text-button profile-back" href="/profile" aria-label={t("Back to profile")}><Icon name="left" size={18}/>{t("Profile")}</Link><div className="page-heading"><h1>{t("Settings")}</h1></div>
    <section className="panel settings-panel" aria-label={t("Preferences")}>
      <div className="setting-row"><div className="setting-label"><label htmlFor="setting-language">{t("Language")}</label></div><LanguageSelect id="setting-language"/></div>
      <div className="setting-row"><div className="setting-label"><label htmlFor="setting-currency">{t("Currency")}</label><span id="currency-soon" className="soon-badge">{t("Soon")}</span></div><select id="setting-currency" aria-describedby="currency-soon" value="IDR" disabled><option value="IDR">{t("Indonesian rupiah (IDR)")}</option></select></div>
    </section>
    <section className="panel"><div className="section-heading"><h2>{t("Categories")}</h2><CategoryButton/></div><div className="category-list">{categories.map(category=><div key={category.id} className="category-row"><div><strong>{category.name}</strong><span className="muted">{t(category.kind)}{category.archived_at ? t(" · archived") : ''}</span></div><div className="card-actions"><CategoryButton category={category}/><ArchiveButton table="categories" id={category.id} name={category.name} archived={Boolean(category.archived_at)}/></div></div>)}</div></section>
  </>;
}
