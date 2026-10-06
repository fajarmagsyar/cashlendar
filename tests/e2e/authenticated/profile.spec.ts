import {test,expect} from '@playwright/test';
test.beforeEach(async({context,request})=>{
  await request.post('http://127.0.0.1:54329/test/reset');
  const {cookieName,cookieValue}=await (await request.get('http://127.0.0.1:54329/test/session')).json();
  await context.addCookies([{name:cookieName,value:cookieValue,domain:'localhost',path:'/',sameSite:'Lax'}]);
});
test('Profile owns account actions, editable name, Family and Settings',async({page})=>{
  await page.goto('/?month=2026-01&view=list');
  await expect(page.getByRole('button',{name:'Sign out',exact:true})).toHaveCount(0);
  await page.getByRole('link',{name:'Open profile',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Profile',exact:true})).toBeVisible();
  await expect(page.getByText('owner@example.com',{exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Manage Google account'})).toHaveAttribute('href','https://myaccount.google.com/');
  await page.getByRole('button',{name:'Edit profile'}).click();
  await page.getByLabel('Display name').fill('Ayu Putri');await page.getByRole('button',{name:'Save profile'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByRole('heading',{name:'Ayu Putri'})).toBeVisible();
  await page.reload();await expect(page.getByRole('heading',{name:'Ayu Putri'})).toBeVisible();
  await page.getByRole('link',{name:/Family.*Browser Test Family/}).click();
  await expect(page.getByRole('heading',{name:'Browser Test Family'})).toBeVisible();
  await expect(page.getByText('Ayu Putri (you)',{exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Back to profile'}).click();
  await page.getByRole('link',{name:'Settings',exact:true}).click();
  await expect(page.getByLabel('Language')).toBeDisabled();await expect(page.getByLabel('Currency')).toBeDisabled();
  await expect(page.getByText('Soon',{exact:true})).toHaveCount(2);
  for(const width of [320,390,768,1440]) {await page.setViewportSize({width,height:800});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await page.goto('/?month=2026-01&view=list');
  await expect(page.locator('.entry-recorder').first()).toHaveText('Recorded by Ayu Putri');
});
test('switch accounts signs out and retains the profile destination',async({page,request})=>{
  await page.goto('/profile');await page.getByRole('button',{name:'Switch Google account'}).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fprofile/);
  expect((await (await request.get('http://127.0.0.1:54329/test/last-logout')).json()).scope).toBe('local');
  await page.goto('/profile');await expect(page).toHaveURL(/\/login/);
});
