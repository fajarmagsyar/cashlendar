import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as redirects from '../../src/lib/supabase/redirects.ts';

test('production OAuth callback uses configured public origin instead of internal localhost',()=>{
  assert.ok('callbackOrigin' in redirects,'callback must resolve the public deployment origin');
  assert.equal(redirects.callbackOrigin('http://localhost:3000/auth/callback',{production:true,appUrl:'https://cashlendar.vercel.app'}),'https://cashlendar.vercel.app');
});
test('Vercel callback recovers the forwarded host when production app URL is still localhost',()=>{
  assert.ok('callbackOrigin' in redirects);
  assert.equal(redirects.callbackOrigin('http://localhost:3000/auth/callback',{production:true,appUrl:'http://localhost:3000',vercel:true,forwardedHost:'cashlendar.vercel.app'}),'https://cashlendar.vercel.app');
  assert.equal(redirects.callbackOrigin('http://localhost:3000/auth/callback',{production:true,appUrl:'https://cashlendar.vercel.app',vercel:true,forwardedHost:'cashlendar-preview.vercel.app'}),'https://cashlendar-preview.vercel.app');
});
test('development stays local and arbitrary forwarded hosts cannot override non-Vercel requests',()=>{
  assert.ok('callbackOrigin' in redirects);
  assert.equal(redirects.callbackOrigin('http://localhost:3000/auth/callback',{production:false,appUrl:'https://cashlendar.vercel.app',vercel:true,forwardedHost:'cashlendar.vercel.app'}),'http://localhost:3000');
  assert.equal(redirects.callbackOrigin('https://cashlendar.vercel.app/auth/callback',{production:true,forwardedHost:'evil.example'}),'https://cashlendar.vercel.app');
});
test('OAuth origin rejects malformed configuration and forwarded host values',()=>{
  assert.ok('callbackOrigin' in redirects);
  for(const appUrl of ['javascript:alert(1)','https://user:password@evil.example','http://localhost:3000','https://127.0.0.1','https://[::1]','https://cashlendar.vercel.app/path','https://cashlendar.vercel.app?next=evil']) {
    assert.equal(redirects.callbackOrigin('https://cashlendar.vercel.app/auth/callback',{production:true,appUrl}),'https://cashlendar.vercel.app');
  }
  for(const forwardedHost of ['evil.example/path','evil.example, cashlendar.vercel.app','user@evil.example','localhost:3000','127.0.0.1','[::1]']) {
    assert.equal(redirects.callbackOrigin('https://cashlendar.vercel.app/auth/callback',{production:true,vercel:true,forwardedHost}),'https://cashlendar.vercel.app');
  }
});
