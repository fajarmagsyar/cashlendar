import indonesian from './id.json';
export type Locale='en'|'id';
export const localeCookie='cashlendar-language';
export const defaultLocale:Locale='id';
const dictionary:Record<string,string>=indonesian;
export function translate(locale:Locale,text:string,values:Record<string,string|number>={}) {
  const template=locale==='id' ? dictionary[text] ?? text : text;
  return template.replace(/\{(\w+)\}/g,(match,key)=>String(values[key] ?? match));
}
export function translator(locale:Locale) {return (text:string,values?:Record<string,string|number>)=>translate(locale,text,values);}
