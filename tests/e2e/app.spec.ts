import { test,expect } from '@playwright/test';
test.beforeEach(async({context})=>{await context.addCookies([{name:'cashlendar-language',value:'en',domain:'localhost',path:'/',sameSite:'Lax'}]);});
test('unconfigured app presents honest setup and contains the layout', async ({page})=>{
  const errors:string[] = [];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading',{name:/Today’s spending/})).toBeVisible();
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

test('landing animation controls, Lottie illustrations and calendar demo work',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/login');
  await expect(page.locator('.landing')).toHaveAttribute('data-motion-ready','true');
  await expect(page.locator('.landing-lottie>svg:not(.landing-lottie-fallback)')).toHaveCount(3);
  await page.getByRole('button',{name:'Tue 22',exact:true}).click();
  await expect(page.locator('.preview-detail')).toContainText('Salary');
  await expect(page.locator('.preview-detail-amount')).toHaveText('+Rp 7.500.000');
  await page.getByRole('button',{name:'Sun 27',exact:true}).click();
  await expect(page.locator('.preview-detail')).toContainText('Planned');
  await page.getByRole('button',{name:'Wed 23',exact:true}).click();
  await expect(page.locator('.preview-detail')).toContainText('No transactions on this day.');
  await page.getByRole('button',{name:'Pause animations'}).click();
  await expect(page.locator('.landing')).toHaveAttribute('data-animations','paused');
  await expect(page.getByRole('button',{name:'Replay animation'})).toBeDisabled();
  await page.getByRole('button',{name:'Play animations'}).click();
  await expect(page.locator('.landing')).toHaveAttribute('data-motion-ready','true');
  await page.getByRole('button',{name:'Replay animation'}).click();
  await page.locator('.landing-savings').scrollIntoViewIfNeeded();
  await expect.poll(()=>page.locator('.preview-savings progress').evaluate(element=>(element as HTMLProgressElement).value)).toBe(40);
  for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Landing at ${width}`).toBe(true);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('.landing')).toHaveAttribute('data-animations','paused');
  await expect(page.getByRole('button',{name:'Play animations'})).toBeDisabled();
  await expect(page.locator('.preview-savings progress')).toHaveAttribute('value','40');
  await page.getByRole('button',{name:'Mon 21',exact:true}).click();
  await expect(page.locator('.preview-detail')).toContainText('Groceries');
  await page.setViewportSize({width:test.info().project.name==='mobile' ? 390 : 1440,height:900});
  await page.evaluate(()=>{if(document.activeElement instanceof HTMLElement) document.activeElement.blur();});
  await page.screenshot({path:`/tmp/cashlendar-landing-${test.info().project.name}.png`,fullPage:true});
  expect(errors).toEqual([]);
});
