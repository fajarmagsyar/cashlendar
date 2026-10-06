import type { CSSProperties } from 'react';
export type IconName = 'calendar'|'chart'|'list'|'wallet'|'savings'|'family'|'plus'|'left'|'right'|'close'|'logout'|'arrow'|'check'|'download'|'profile'|'settings';
const paths: Record<IconName,string> = {
  profile:'M20 21v-2a7 7 0 0 0-14 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  settings:'M4 7h16M4 17h16M9 4v6M15 14v6',
  calendar:'M6 3v4m12-4v4M3 10h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM7 14h2m6 0h2m-10 4h2',
  chart:'M4 4v16h17M8 16v-4m5 4V7m5 9v-6', list:'M8 6h13M8 12h13M8 18h13M3 6h1m-1 6h1m-1 6h1',
  wallet:'M4 5h15v4M4 5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h17V9H4a2 2 0 0 1 0-4zM21 13h-6v4h6',
  savings:'M12 3v3m-4-1h8M5 12a7 7 0 1 1 14 0v8H5v-8zM9 12h6m-3-3v6',
  family:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M20 21v-2a4 4 0 0 0-3-4m-1-12a4 4 0 0 1 0 8',
  plus:'M12 5v14M5 12h14',left:'m15 5-7 7 7 7',right:'m9 5 7 7-7 7',close:'m6 6 12 12M6 18 18 6',logout:'M9 3H4v18h5m5-14 5 5-5 5m-6-5h13',arrow:'M5 12h14m-5-5 5 5-5 5',check:'m5 12 4 4L19 6',download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5'
};
export function Icon({ name, size=20, style }: { name:IconName; size?:number; style?:CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name]}/></svg>;
}
