export function todayJakarta(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.slice(0, 4) < '1900' || value.slice(0, 4) > '9999') return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
export function validateEntryDate(value: string, today = todayJakarta()): string {
  if (!validDate(value)) throw new Error('Choose a valid date.');
  if (value > today) throw new Error('Transactions cannot have a future date.');
  return value;
}
export function getMonthRange(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month) || !validDate(`${month}-01`) || month === '9999-12') throw new Error('Choose a valid month.');
  const next = new Date(`${month}-01T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return { start: `${month}-01`, endExclusive: next.toISOString().slice(0, 10) };
}
export function shiftMonth(month: string, offset: number): string {
  const date = new Date(`${getMonthRange(month).start}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}
export function monthLabel(month: string,locale:string='en'): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${getMonthRange(month).start}T00:00:00Z`));
}
export function dayLabel(date: string,locale:string='en'): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}
export function calendarDays(month: string) {
  const { start, endExclusive } = getMonthRange(month);
  const date = new Date(`${start}T00:00:00Z`);
  const startOffset = (date.getUTCDay() + 6) % 7;
  const dayCount = new Date(new Date(`${endExclusive}T00:00:00Z`).getTime() - 86400000).getUTCDate();
  date.setUTCDate(date.getUTCDate() - startOffset);
  return Array.from({ length: Math.ceil((startOffset + dayCount) / 7) * 7 }, (_, i) => {
    const current = new Date(date.getTime() + i * 86400000).toISOString().slice(0, 10);
    return { date: current, inMonth: current.startsWith(month) };
  });
}
