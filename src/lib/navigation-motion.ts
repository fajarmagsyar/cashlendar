const tabs=['/','/accounts','/more','/profile'];
function location(path:string) {
  if(path.startsWith('/board/')) return {tab:2,depth:2};
  if(['/savings','/board'].includes(path)) return {tab:2,depth:1};
  if(['/settings','/family'].includes(path)) return {tab:3,depth:1};
  return {tab:Math.max(0,tabs.indexOf(path)),depth:0};
}
export function isNestedRoute(path:string) {return location(path).depth>0;}
export function navigationMotion(from:string,to:string) {
  if(from===to) return 'none';
  const a=location(from),b=location(to);
  if(a.tab!==b.tab) return b.tab>a.tab ? 'slide-left' : 'slide-right';
  return b.depth>a.depth ? 'zoom-in' : b.depth<a.depth ? 'zoom-out' : 'none';
}
