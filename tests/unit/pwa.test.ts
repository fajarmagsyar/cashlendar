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
