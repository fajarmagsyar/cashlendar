import { test,expect } from '@playwright/test';
test('unconfigured app presents honest setup and contains the layout', async ({page})=>{
  const errors:string[] = [];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading',{name:/fresh start/})).toBeVisible();
  await expect(page.getByText('Connect Supabase to get started')).toBeVisible();
  await expect(page.getByText('Continue with Google',{exact:true})).toHaveCount(0);
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  }
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link',{name:'Skip to content'})).toBeFocused();
  await page.screenshot({path:`test-results/login-${test.info().project.name}.png`,fullPage:true});
  expect(errors).toEqual([]);
});
test('protected routes do not reveal household data without configuration',async({page})=>{
  for(const route of ['/accounts','/savings','/charts','/list','/family','/profile','/settings','/onboarding']){
    await page.goto(route);await expect(page).toHaveURL(/\/login/);
  }
});
test('PWA manifest, install icons, and offline navigation work without caching private data',async({page,context,request})=>{
  const manifest=await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.name).toBe('Cashlendar');expect(manifest.display).toBe('standalone');expect(manifest.scope).toBe('/');
  for(const icon of manifest.icons){const response=await request.get(icon.src);expect(response.status()).toBe(200);expect(response.headers()['content-type']).toContain('image/png');}
  await page.goto('/login');
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  const paths=await page.evaluate(async()=>{
    const keys=await caches.keys();return (await Promise.all(keys.map(async key=>(await (await caches.open(key)).keys()).map(r=>new URL(r.url).pathname)))).flat();
  });
  expect(paths).toContain('/offline.html');
  expect(paths.every(path=>path==='/offline.html' || path.startsWith('/icons/'))).toBe(true);
  await context.setOffline(true);
  await page.goto('/');
  await expect(page.getByRole('heading',{name:/moment to reconnect/i})).toBeVisible();
  await context.setOffline(false);
  await page.getByRole('link',{name:'Try again'}).click();
  await expect(page.getByText('Connect Supabase to get started')).toBeVisible();
});
