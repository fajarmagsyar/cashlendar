import type { EntryFilters } from '@/lib/finance/types';
export function filterUrl(path:string,filters:EntryFilters,overrides:Record<string,string|number> = {}) {
  const values = { ...filters,...overrides };
  const params = new URLSearchParams();
  Object.entries(values).forEach(([k,v])=>{ if (v && !(k==='page' && v===1) && !(k==='view' && v==='calendar')) params.set(k,String(v)); });
  return `${path}?${params}`;
}
