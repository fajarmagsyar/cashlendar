import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
test('worker caches public assets only and returns an offline document on failed navigation', async () => {
  const handlers: Record<string, (event: {request?:unknown;respondWith?:(p:Promise<unknown>)=>void;waitUntil?:(p:Promise<unknown>)=>void})=>void> = {};
  const cached:string[] = [];
  const offline = { offline:true };
  const context = {
    self:{ location:{ origin:'https://app.test' },addEventListener:(name:string,handler:typeof handlers[string])=>{handlers[name]=handler;},skipWaiting:async()=>{},clients:{claim:async()=>{}} },
    URL,fetch:async()=>{throw new Error('offline');},
    caches:{ open:async()=>({ addAll:async(urls:string[])=>{cached.push(...urls);},match:async(path:string)=>path==='/offline.html' ? offline : null }),match:async()=>offline,keys:async()=>['cashlendar-public-old','unrelated-cache'],delete:async()=>true }
  };
  vm.runInNewContext(await readFile('public/sw.js','utf8'),context);
  let installed:Promise<unknown> | undefined;
  handlers.install({ waitUntil:p=>{installed=p;} }); await installed;
  assert(cached.includes('/offline.html'));
  for (const path of cached) assert(path==='/offline.html' || path.startsWith('/icons/'));
  for (const url of ['https://db.supabase.co/rest/v1/accounts','https://app.test/auth/callback','https://app.test/api/finance']) {
    let responded = false;
    handlers.fetch({ request:{method:'GET',url,mode:'cors'},respondWith:()=>{responded=true;} });
    assert.equal(responded,false);
  }
  let response:Promise<unknown> | undefined;
  handlers.fetch({ request:{method:'GET',url:'https://app.test/',mode:'navigate'},respondWith:p=>{response=p;} });
  assert.equal(await response,offline);
});

test('push displays a reminder and notification taps open the same-origin board',async()=>{
  type WorkerEvent={data?:{json:()=>unknown};notification?:{close:()=>void};waitUntil:(promise:Promise<unknown>)=>void};
  const handlers:Record<string,(event:WorkerEvent)=>void>={};
  const shown:{title:string;options:{body:string;data:{url:string}}}[]=[];
  const opened:string[]=[];let focused=false,closed=false;
  const windows:{url:string;navigate:(url:string)=>Promise<void>;focus:()=>Promise<void>}[]=[{url:'https://app.test/accounts',navigate:async url=>{opened.push(url);},focus:async()=>{focused=true;}}];
  const self={location:{origin:'https://app.test'},addEventListener:(name:string,handler:(event:WorkerEvent)=>void)=>{handlers[name]=handler;},registration:{showNotification:async(title:string,options:typeof shown[number]['options'])=>{shown.push({title,options});}},clients:{matchAll:async()=>windows,openWindow:async(url:string)=>{opened.push(url);}}};
  vm.runInNewContext(await readFile('public/sw.js','utf8'),{self,URL});
  let pending:Promise<unknown>=Promise.resolve();
  const waitUntil=(promise:Promise<unknown>)=>{pending=promise;};
  handlers.push({data:{json:()=>({body:'A family reminder is due.',url:'https://outside.test'})},waitUntil});await pending;
  assert.equal(shown[0].title,'Cashlendar');assert.equal(shown[0].options.data.url,'/board');
  handlers.notificationclick({notification:{close:()=>{closed=true;}},waitUntil});await pending;
  assert.equal(closed,true);assert.equal(focused,true);assert.deepEqual(opened,['/board']);
  windows.length=0;handlers.notificationclick({notification:{close:()=>{}},waitUntil});await pending;
  assert.deepEqual(opened,['/board','/board']);
  handlers.push({data:{json:()=>{throw new Error('bad payload');}},waitUntil});assert.equal(shown.length,1);
});
