import {test,expect} from '@playwright/test';

test.beforeEach(async({context,request})=>{
  await request.post('http://127.0.0.1:54329/test/reset');
  const {cookieName,cookieValue}=await (await request.get('http://127.0.0.1:54329/test/session')).json();
  await context.addCookies([{name:cookieName,value:cookieValue,domain:'localhost',path:'/',sameSite:'Lax'}]);
});

test('a calendar render shares authentication and account queries',async({page,request})=>{
  await page.goto('/?month=2026-01&day=2026-01-06');
  await expect(page.getByRole('tab',{name:'Calendar',exact:true})).toBeVisible();
  const counts=await (await request.get('http://127.0.0.1:54329/test/request-counts')).json();
  expect(counts['/rest/v1/household_members']).toBe(1);
  expect(counts['/rest/v1/households'] || 0).toBe(0);
  expect(counts['/rest/v1/accounts']).toBe(1);
  expect(counts['/rest/v1/categories']).toBe(1);
  // The proxy independently validates the session before the render.
  expect(counts['/auth/v1/user']).toBeLessThanOrEqual(2);
});

test('verified asymmetric sessions render without an Auth user lookup',async({page,context,request})=>{
  const {cookieName,cookieValue}=await (await request.get('http://127.0.0.1:54329/test/session?asymmetric=1')).json();
  await context.clearCookies();
  await context.addCookies([{name:cookieName,value:cookieValue,domain:'localhost',path:'/',sameSite:'Lax'}]);
  await page.goto('/profile');
  await expect(page.getByRole('heading',{name:'Test Owner',exact:true})).toBeVisible();
  await expect(page.getByText('owner@example.com', {exact:true})).toBeVisible();
  const counts=await (await request.get('http://127.0.0.1:54329/test/request-counts')).json();
  expect(counts['/auth/v1/user'] || 0).toBe(0);
});

test('a forged identity is rejected before household data is loaded',async({page,context,request})=>{
  const {cookieName,cookieValue}=await (await request.get('http://127.0.0.1:54329/test/session?asymmetric=1')).json();
  const session=JSON.parse(Buffer.from(cookieValue.slice(7),'base64url').toString());
  const [header,payload,signature]=session.access_token.split('.');
  const claims=JSON.parse(Buffer.from(payload,'base64url').toString());
  claims.sub='10000000-0000-4000-8000-000000000002';
  session.access_token=`${header}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.${signature}`;
  session.user.id=claims.sub;
  await context.clearCookies();
  await context.addCookies([{name:cookieName,value:`base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`,domain:'localhost',path:'/',sameSite:'Lax'}]);
  await page.goto('/accounts');
  await expect(page).toHaveURL(/\/login/);
  const counts=await (await request.get('http://127.0.0.1:54329/test/request-counts')).json();
  expect(counts['/rest/v1/household_members'] || 0).toBe(0);
});

test('slow initial data shows the household skeleton without overflow',async({page,request})=>{
  await request.post('http://127.0.0.1:54329/test/delay?ms=800');
  try {
    await page.goto('/?month=2026-01',{waitUntil:'commit'});
    const loading=page.locator('.view-loading');
    await expect(loading).toBeVisible();
    await expect(loading).toHaveAttribute('aria-busy','true');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:`test-results/household-loading-${test.info().project.name}.png`});
    await expect(page.getByRole('tab',{name:'Calendar',exact:true})).toBeVisible();
    await expect(loading).toHaveCount(0);
  } finally {await request.post('http://127.0.0.1:54329/test/delay?ms=0');}
});

test('Calendar loads only the selected day and Charts skips transaction rows',async({page,request})=>{
  await page.goto('/?month=2026-01&day=2026-01-06');
  let counts=await (await request.get('http://127.0.0.1:54329/test/request-counts')).json();
  expect(counts['/rest/v1/rpc/list_entries']).toBe(1);
  await request.post('http://127.0.0.1:54329/test/reset');
  await page.goto('/?view=charts&month=2026-01');
  await expect(page.getByRole('heading',{name:'Where it went'})).toBeVisible();
  counts=await (await request.get('http://127.0.0.1:54329/test/request-counts')).json();
  expect(counts['/rest/v1/rpc/list_entries'] || 0).toBe(0);
  await page.goto('/?view=list&month=2026-01');
  await expect(page.locator('.entry-row')).toHaveCount(50);
});

test('changing the selected day gives feedback before server data arrives',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/?month=2026-01&day=2026-01-06');
  let release!:()=>void;
  const held=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/*',async route=>{
    if(route.request().headers()['rsc']==='1') await held;
    await route.continue();
  });
  try {
    await page.getByRole('link',{name:/Wednesday, January 7/}).click();
    await expect(page.getByRole('status').filter({hasText:'Loading'})).toBeVisible({timeout:1000});
    await expect(page.locator('.loading-spinner')).toHaveCSS('animation-name','none');
    await expect(page.locator('.navigation-progress-bar')).toHaveCSS('animation-name','none');
    await page.screenshot({path:`test-results/navigation-loading-${test.info().project.name}.png`});
  } finally {release();}
  await expect(page.getByRole('link',{name:/Wednesday, January 7/})).toHaveAttribute('aria-current','date');
  await expect(page.getByRole('status').filter({hasText:'Loading'})).toHaveCount(0);
});

test('saving updates the page without a second refresh request',async({page})=>{
  await page.goto('/accounts');
  await page.getByRole('button',{name:'Add account',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Add account'});
  await dialog.getByLabel('Account name').fill('Responsive account');
  let refreshRequests=0;
  page.on('request',request=>{
    if(request.method()==='GET' && request.headers()['rsc']==='1' && !request.headers()['next-router-prefetch']) refreshRequests++;
  });
  await dialog.getByRole('button',{name:'Save account',exact:true}).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Responsive account',exact:true})).toBeVisible();
  expect(refreshRequests).toBe(0);
});

test('applying filters keeps the app mounted and shows immediate feedback',async({page})=>{
  await page.goto('/?view=list&month=2026-01');
  await page.getByRole('searchbox',{name:'Search entries'}).fill('Fixture expense 55');
  let documents=0;
  page.on('request',request=>{if(request.isNavigationRequest()) documents++;});
  let release!:()=>void;
  const held=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/*',async route=>{
    if(route.request().headers()['rsc']==='1') await held;
    await route.continue();
  });
  try {
    await page.getByRole('button',{name:'Apply',exact:true}).click();
    await expect(page.getByRole('button',{name:'Applying…',exact:true})).toBeDisabled({timeout:1000});
  } finally {release();}
  await expect(page.locator('.entry-row')).toHaveCount(1);
  await expect(page.locator('.entry-row')).toContainText('Fixture expense 55');
  expect(documents).toBe(0);
});
