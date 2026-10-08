import {test,expect} from '@playwright/test';

test('the main menu prefetches a complete screen before clicking',async({page,context,request})=>{
  test.skip(process.env.AUTH_E2E_PRODUCTION!=='1','Automatic prefetching runs in production.');
  await request.post('http://127.0.0.1:54329/test/reset');
  const {cookieName,cookieValue}=await (await request.get('http://127.0.0.1:54329/test/session')).json();
  await context.addCookies([{name:cookieName,value:cookieValue,domain:'localhost',path:'/',sameSite:'Lax'}]);
  const prefetched=(path:string,content:string)=>page.waitForResponse(async response=>{
    if(new URL(response.url()).pathname!==path || response.request().headers()['rsc']!=='1') return false;
    try {
      if(await response.finished()) return false;
      return (await response.text()).includes(content);
    } catch {return false;}
  });
  const accounts=prefetched('/accounts','Daily cash');
  await page.goto('/profile');
  await expect(page.getByRole('heading',{name:'Profile',exact:true})).toBeVisible();
  await accounts;
  let requests=0;
  let release!:()=>void;
  const held=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/*',async route=>{
    if(route.request().headers()['rsc']==='1' && new URL(route.request().url()).pathname==='/accounts') {requests++;await held;}
    await route.continue();
  });
  try {
    const nav=page.getByRole('navigation',{name:'Main navigation'});
    await nav.getByRole('link',{name:'Accounts',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Daily cash',exact:true})).toBeVisible({timeout:700});
    expect(requests).toBe(0);
  } finally {release();}
});
