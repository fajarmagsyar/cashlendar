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
  expect(counts['/rest/v1/households']).toBe(1);
  expect(counts['/rest/v1/accounts']).toBe(1);
  expect(counts['/rest/v1/categories']).toBe(1);
  // The proxy independently validates the session before the render.
  expect(counts['/auth/v1/user']).toBeLessThanOrEqual(2);
});

test('changing the selected day gives feedback before server data arrives',async({page})=>{
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
