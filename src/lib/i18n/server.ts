import {cache} from 'react';
import {cookies} from 'next/headers';
import {defaultLocale,localeCookie,translator,type Locale} from './shared';
export const getLocale=cache(async():Promise<Locale>=>{
  const value=(await cookies()).get(localeCookie)?.value;
  return value==='id' || value==='en' ? value : defaultLocale;
});
export async function getTranslations() {const locale=await getLocale();return {locale,t:translator(locale)};}
