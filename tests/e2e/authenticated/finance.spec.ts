import { test,expect } from '@playwright/test';
test.beforeEach(async({context,request})=>{
  await request.post('http://127.0.0.1:54329/test/reset');
  const {cookieName,cookieValue}=await (await request.get('http://127.0.0.1:54329/test/session')).json();
  await context.addCookies([{name:'cashlendar-language',value:'en',domain:'localhost',path:'/',sameSite:'Lax'},{name:cookieName,value:cookieValue,domain:'localhost',path:'/',httpOnly:false,sameSite:'Lax'}]);
});
test('three views show complete totals and support keyboard entry editing and deletion',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?month=2026-01&day=2026-01-06');
  await expect(page.getByRole('heading',{name:test.info().project.name==='mobile' ? 'Money' : 'Calendar',exact:true})).toBeVisible();
  await expect(page.getByLabel('Monthly totals')).toContainText('55.000');
  await expect(page.getByRole('link',{name:/Monday, December 29/})).toHaveAttribute('aria-label',/outside this month; select to load entries/);
  await page.getByRole('button',{name:'Add transaction',exact:true}).click();
  const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
  await dialog.getByLabel('Amount (IDR)').fill('9007199254740992');await dialog.getByLabel('Account',{exact:true}).selectOption({label:'Daily cash'});
  await dialog.getByLabel('Category',{exact:true}).selectOption({label:'Food & groceries'});
  await dialog.getByRole('button',{name:'Save transaction'}).click();
  await expect(dialog.getByLabel('Amount (IDR)')).toHaveAttribute('aria-invalid','true');
  await expect(dialog.getByLabel('Amount (IDR)')).toHaveValue('9.007.199.254.740.992');
  await dialog.getByLabel('Amount (IDR)').fill('12500');
  const note=`Browser expense ${test.info().project.name}`;
  await dialog.getByLabel('Note (optional)').fill(note);await dialog.getByRole('button',{name:'Save transaction'}).click();
  await expect(dialog).toHaveCount(0);await expect(page.getByText(note,{exact:true})).toBeVisible();
  const row=page.locator('article').filter({has:page.getByText(note,{exact:true})});
  await row.getByRole('button',{name:'Edit',exact:true}).click();await page.getByLabel('Amount (IDR)').fill('15000');await page.getByRole('button',{name:'Save changes'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);await expect(row).toContainText('15.000');
  await row.getByRole('button',{name:'Delete',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Delete entry'}).click();
  await expect(page.getByText(note,{exact:true})).toHaveCount(0);
  await page.goto('/charts?month=2026-01');await expect(page.getByRole('heading',{name:'Where it went'})).toBeVisible();
  await expect(page.getByLabel('Monthly totals')).toContainText('55.000');
  await page.goto('/list?month=2026-01');await expect(page.getByText('55 entries',{exact:true})).toBeVisible();await expect(page.locator('.entry-row')).toHaveCount(50);
  await page.getByRole('link',{name:'Next',exact:true}).click();await expect(page.locator('.entry-row')).toHaveCount(5);
  expect(errors).toEqual([]);
});
test('supporting screens render on phone and desktop, and dialogs restore keyboard focus',async({page})=>{
  for(const route of ['/accounts','/savings','/family','/profile','/settings','/?month=2026-01','/charts?month=2026-01','/list?month=2026-01']){
    await page.goto(route);
    await expect(page.locator('.page-heading')).toBeVisible();
    for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);}
    await page.setViewportSize({width:test.info().project.name==='mobile' ? 390 : 1440,height:900});
    await page.screenshot({path:`test-results/${route.split('?')[0].replaceAll('/','') || 'calendar'}-${test.info().project.name}.png`});
  }
  await page.goto('/accounts');
  const button=page.getByRole('button',{name:'Add account',exact:true});await button.click();await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(button).toBeFocused();
});
test('savings contributions transfer funds without changing monthly expenses',async({page})=>{
  await page.goto('/savings');
  await page.getByRole('button',{name:'Add savings',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await dialog.getByLabel('Amount (IDR)').fill('50000');await dialog.getByLabel('Date',{exact:true}).fill('2026-01-05');
  await dialog.getByLabel('From account').selectOption({label:'Daily cash'});await dialog.getByRole('button',{name:'Save transfer'}).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('status').filter({hasText:'Transfer saved.'})).toBeVisible();
  await page.goto('/charts?month=2026-01');await expect(page.getByLabel('Monthly totals')).toContainText('55.000');
});
test('switching Google accounts preserves the invitation destination',async({page})=>{
  const token='f'.repeat(64);
  await page.goto(`/invite?token=${token}`);
  await page.getByRole('button',{name:'Use a different Google account'}).click();
  await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(`/invite?token=${token}`)}`));
});
test('sign-out and browser history do not expose the previous household',async({page})=>{
  await page.goto('/accounts');await expect(page.getByRole('heading',{name:'Accounts',exact:true})).toBeVisible();
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Profile',exact:true}).click();
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page).toHaveURL(/\/login/);
  await page.goBack();await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading',{name:'Accounts',exact:true})).toHaveCount(0);
});
test('members cannot see owner-only invitation or membership controls',async({page,context,request})=>{
  const {cookieName,cookieValue}=await (await request.get('http://127.0.0.1:54329/test/session?member=1')).json();
  await context.clearCookies();await context.addCookies([{name:'cashlendar-language',value:'en',domain:'localhost',path:'/',sameSite:'Lax'},{name:cookieName,value:cookieValue,domain:'localhost',path:'/',httpOnly:false,sameSite:'Lax'}]);
  await page.goto('/family');await expect(page.getByRole('heading',{name:'Browser Test Family'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Invite family'})).toHaveCount(0);await expect(page.getByRole('button',{name:'Remove',exact:true})).toHaveCount(0);
});
test('account and savings goal forms persist real database records',async({page})=>{
  const account=`Browser savings ${test.info().project.name}`,goal=`Browser goal ${test.info().project.name}`;
  await page.goto('/accounts');await page.getByRole('button',{name:'Add account',exact:true}).click();
  let dialog=page.getByRole('dialog');await dialog.getByLabel('Account name').fill(account);await dialog.getByLabel('Account type').selectOption('savings');
  await dialog.getByLabel('Opening balance (IDR)').fill('10000');await dialog.getByRole('button',{name:'Save account'}).click();await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('heading',{name:account,exact:true})).toBeVisible();
  await page.goto('/savings');await page.getByRole('button',{name:'Create savings goal',exact:true}).click();dialog=page.getByRole('dialog');
  await dialog.getByLabel('Goal name').fill(goal);await dialog.getByLabel('Savings account').selectOption({label:account});await dialog.getByLabel('Target amount (IDR)').fill('20000');await dialog.getByRole('button',{name:'Save goal'}).click();
  await expect(dialog).toHaveCount(0);await expect(page.getByRole('heading',{name:goal,exact:true})).toBeVisible();
  const card=page.locator('article').filter({has:page.getByRole('heading',{name:goal,exact:true})});await expect(card).toContainText('50% funded');
  await card.getByRole('button',{name:'Archive',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Archive',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);await expect(card).toContainText('Archived');
});
