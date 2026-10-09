import type { CSSProperties } from 'react';
export type IconName = 'export'|'reload'|'chip'|'text'|'checklist'|'table'|'pen'|'heading'|'bold'|'italic'|'up'|'down'|'trash'|'undo'|'eraser'|'row-add'|'column-add'|'row-remove'|'column-remove'|'info'|'save'|'tools'|'board'|'bell'|'calendar'|'chart'|'list'|'wallet'|'savings'|'family'|'plus'|'left'|'right'|'close'|'logout'|'arrow'|'check'|'download'|'profile'|'settings';
const paths: Record<IconName,string> = {
  export:'M14 3h7v7M21 3 10 14M10 5H4v16h16v-6',
  reload:'M20 4v6h-6M20 10a8 8 0 1 0 0 6',
  chip:'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 4v16M15 4v16M3 9h6M15 9h6M3 15h6M15 15h6M9 12h6',
  text:'M4 5h16M12 5v15M8 20h8',
  checklist:'M4 4h5v5H4zM13 6h7M4 14l2 2 4-4M13 15h7M13 20h7',
  table:'M3 4h18v16H3zM3 9h18M3 14h18M9 4v16M15 4v16',
  pen:'m4 16 12-12 4 4L8 20H4v-4zM13 7l4 4',
  heading:'M5 5v14M15 5v14M5 12h10M19 13v6M18 14l1-1',
  bold:'M7 4h6a4 4 0 0 1 0 8H7V4zM7 12h7a4 4 0 0 1 0 8H7v-8z',
  italic:'M10 4h9M5 20h9M15 4 9 20',
  up:'M12 20V4m-6 6 6-6 6 6',down:'M12 4v16m-6-6 6 6 6-6',
  trash:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
  undo:'M9 4 4 9l5 5M4 9h10a6 6 0 0 1 0 12',
  eraser:'m3 14 10-10a2 2 0 0 1 3 0l5 5-11 11H7l-4-4a2 2 0 0 1 0-2zM8 9l8 8M10 20h11',
  'row-add':'M3 3h18v9H3zM3 8h18M12 15v6M9 18h6',
  'column-add':'M3 3h9v18H3zM8 3v18M15 12h6M18 9v6',
  'row-remove':'M3 3h18v9H3zM3 8h18M9 18h6',
  'column-remove':'M3 3h9v18H3zM8 3v18M15 12h6',
  info:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 11v6M12 7h.01',
  save:'M4 3h13l4 4v14H3V3h1zM7 3v6h10V3M7 21v-8h10v8',

  tools:'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  board:'M5 3h14v18H5zM8 7h8M8 11h8M8 15h5',
  bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
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
