import {test,expect} from '@playwright/test';
test.beforeEach(async({context,request})=>{
  await request.post('http://127.0.0.1:54329/test/reset');
  const session=await (await request.get('http://127.0.0.1:54329/test/session?photo=1')).json();
  await context.addCookies([{name:'cashlendar-language',value:'id',domain:'localhost',path:'/'},{name:session.cookieName,value:session.cookieValue,domain:'localhost',path:'/'}]);
});

test('calendar omits filters, profile uses a photo and touch highlights are disabled',async({page})=>{
  await page.route('https://example.test/avatar.svg',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#174f3e"/></svg>'}));
  await page.setViewportSize({width:390,height:850});
  await page.goto('/?month=2026-01&search=not-a-real-entry&kind=income');
  await expect(page.locator('.filter-form')).toHaveCount(0);
  await expect(page.locator('.calendar-day .expense-text')).toHaveCount(1);
  await expect(page.getByRole('link',{name:'Bulan berikutnya'})).toBeVisible();
  const nav=page.getByRole('navigation').filter({visible:true});
  const profile=nav.getByRole('link',{name:'Profil',exact:true});
  await expect(profile.locator('img')).toHaveAttribute('src','https://example.test/avatar.svg');
  await expect.poll(()=>profile.locator('img').evaluate(image=>(image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(profile).toHaveCSS('-webkit-tap-highlight-color','rgba(0, 0, 0, 0)');
  await profile.focus();
  await expect(profile).toHaveCSS('outline-style','solid');
  await expect(page.locator('.app-header .header-user')).toBeVisible();
  for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:850});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(width<=760) {const brand=await page.locator('.app-header .brand').boundingBox();expect(Math.abs(brand!.x+brand!.width/2-width/2)).toBeLessThan(2);}
  }
  await page.getByRole('tab',{name:'Daftar',exact:true}).click();
  await expect(page.locator('.filter-form')).toBeVisible();
});

test('a failed profile photo falls back to the user initial',async({page})=>{
  await page.route('https://example.test/avatar.svg',route=>route.abort());
  await page.goto('/');
  const avatar=page.getByRole('navigation').filter({visible:true}).locator('.nav-avatar');
  await expect(avatar.locator('img')).toHaveCount(0);
  await expect(avatar).toHaveText('T');
});

test('savings and fridge notes share a quiet empty state and a labelled add action',async({page,request})=>{
  await request.post('http://127.0.0.1:54329/test/reset?emptySavings=1');
  await page.goto('/savings');
  await expect(page.locator('.fridge-empty')).toHaveText('Belum ada');
  await expect(page.locator('.page-heading button')).toContainText('Tabungan');
  await expect(page.locator('.fridge-empty button')).toHaveCount(0);
  await page.locator('.page-heading button').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'Tutup dialog'}).click();
  await page.goto('/board');
  await expect(page.locator('.fridge-empty')).toHaveText('Belum ada');
  await expect(page.locator('.page-heading a')).toHaveText('Catatan');
  for(const width of [320,390]) {
    await page.setViewportSize({width,height:850});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Fridge notes at ${width}`).toBe(true);
  }
  await page.locator('.page-heading a').click();
  await expect(page.getByRole('textbox',{name:'Judul',exact:true})).toBeVisible();
});
