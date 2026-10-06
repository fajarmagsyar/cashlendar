import {test,expect,type Page} from '@playwright/test';
async function openPlan(page:Page) {
  if((page.viewportSize()?.width || 1440)<=760) await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Add transaction'}).click();
  else await page.getByRole('button',{name:'Plan expense',exact:true}).click();
}
test.beforeEach(async({context,request})=>{
  await request.post('http://127.0.0.1:54329/test/reset');
  const {cookieName,cookieValue}=await (await request.get('http://127.0.0.1:54329/test/session')).json();
  await context.addCookies([{name:cookieName,value:cookieValue,domain:'localhost',path:'/',httpOnly:false,sameSite:'Lax'}]);
});

test('future plans appear on the calendar, move when edited, and become expenses only when paid',async({page})=>{
  await page.goto('/?month=2030-01&day=2030-01-21');
  await openPlan(page);
  let dialog=page.getByRole('dialog');
  await expect(dialog).toHaveAccessibleName('Plan an expense');
  await expect(dialog.getByLabel('Date',{exact:true})).toHaveValue('2030-01-21');
  await dialog.getByRole('button',{name:'Expense',exact:true}).click();
  await expect(dialog.getByLabel('Date',{exact:true})).toHaveValue('2030-01-21');
  await dialog.getByLabel('Amount (IDR)').fill('150000');
  await expect(dialog.getByLabel('Amount (IDR)')).toHaveValue('150.000');
  await dialog.getByLabel('Account',{exact:true}).selectOption({label:'Daily cash'});
  await dialog.getByLabel('Category',{exact:true}).selectOption({label:'Food & groceries'});
  await dialog.getByLabel('Note (optional)').fill('Planned school supplies');
  await page.screenshot({path:`test-results/entry-sheet-${test.info().project.name}.png`});
  await dialog.getByRole('button',{name:'Save plan'}).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('link',{name:/Monday, January 21.*1 planned expense/})).toBeVisible();
  await expect(page.getByLabel('Monthly totals')).toContainText('Rp');
  await expect(page.getByLabel('Monthly totals')).not.toContainText('150.000');
  let row=page.locator('.planned-row').filter({hasText:'Planned school supplies'});
  await expect(row).toContainText('150.000');
  await page.screenshot({path:`test-results/planned-calendar-${test.info().project.name}.png`});
  await row.getByRole('button',{name:'Edit',exact:true}).click();
  await page.getByLabel('Amount (IDR)').fill('200000');await page.getByLabel('Date',{exact:true}).fill('2030-01-22');
  await page.getByRole('button',{name:'Save changes'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Planned school supplies',{exact:true})).toHaveCount(0);
  await page.getByRole('link',{name:/Tuesday, January 22.*1 planned expense/}).click();
  row=page.locator('.planned-row').filter({hasText:'Planned school supplies'});await expect(row).toContainText('200.000');
  await row.getByRole('button',{name:'Edit',exact:true}).click();await page.getByLabel('Amount (IDR)').fill('150000');await page.getByRole('button',{name:'Save changes'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await row.getByRole('button',{name:'Mark paid'}).click();dialog=page.getByRole('dialog');
  await dialog.getByLabel('Payment date').fill('2026-01-06');await dialog.getByRole('button',{name:'Record expense'}).click();
  await expect(dialog).toHaveCount(0);await expect(row).toHaveCount(0);
  await page.goto('/?month=2026-01&day=2026-01-06');
  await expect(page.locator('.entry-row').filter({hasText:'Planned school supplies'})).toHaveCount(1);
  await expect(page.getByLabel('Monthly totals')).toContainText('205.000');
  await page.goto('/accounts');await expect(page.locator('.account-card').filter({hasText:'Daily cash'})).toContainText('4.795.000');
});

test('planned expenses can be deleted without changing recorded totals',async({page})=>{
  await page.goto('/?month=2030-01&day=2030-01-21');await openPlan(page);
  const dialog=page.getByRole('dialog');await dialog.getByLabel('Amount (IDR)').fill('1000');
  await dialog.getByLabel('Account',{exact:true}).selectOption({label:'Daily cash'});await dialog.getByLabel('Category',{exact:true}).selectOption({label:'Food & groceries'});
  await dialog.getByLabel('Note (optional)').fill('Cancelled plan');await dialog.getByRole('button',{name:'Save plan'}).click();
  await expect(dialog).toHaveCount(0);await page.locator('.planned-row').getByRole('button',{name:'Delete',exact:true}).click();
  await page.getByRole('button',{name:'Delete plan',exact:true}).click();await expect(page.locator('.planned-row')).toHaveCount(0);
  await page.goto('/charts?month=2026-01');await expect(page.getByLabel('Monthly totals')).toContainText('55.000');
});

test('amount entry formats typing, preserves cursor edits, and rejects pasted decimals',async({page})=>{
  await page.goto('/?month=2026-01&day=2026-01-06');await page.getByRole('button',{name:'Add transaction',exact:true}).click();
  const dialog=page.getByRole('dialog'),amount=dialog.getByLabel('Amount (IDR)');await expect(amount).toBeFocused();
  await amount.pressSequentially('1234567',{delay:30});await expect(amount).toHaveValue('1.234.567');
  await amount.evaluate((el:HTMLInputElement)=>el.setSelectionRange(2,2));await amount.press('Backspace');await expect(amount).toHaveValue('234.567');
  await amount.fill('1234567');await amount.evaluate((el:HTMLInputElement)=>el.setSelectionRange(1,1));await amount.press('Delete');await expect(amount).toHaveValue('134.567');
  await amount.fill('1.25');await dialog.getByLabel('Account',{exact:true}).selectOption({label:'Daily cash'});await dialog.getByLabel('Category',{exact:true}).selectOption({label:'Food & groceries'});
  await dialog.getByRole('button',{name:'Save transaction'}).click();await expect(amount).toHaveAttribute('aria-invalid','true');await expect(amount).toHaveValue('1.25');
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
});

test('all navigation destinations remain accessible in the floating phone dock',async({page})=>{
  await page.setViewportSize({width:320,height:700});await page.goto('/');
  const nav=page.getByRole('navigation',{name:'Main navigation'});await expect(nav.getByRole('link')).toHaveCount(4);
  await expect(nav.getByRole('button',{name:'Add transaction'})).toBeInViewport();
  for(const label of ['Money','Accounts','Savings','Family']){
    const link=nav.getByRole('link',{name:label,exact:true});await expect(link).toBeInViewport();
    const box=await link.boundingBox();expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44);
    await link.click();await expect(link).toHaveAttribute('aria-current','page');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
});

test('entry sheet keeps the focused note above Save in short phone viewports',async({page})=>{
  await page.setViewportSize({width:320,height:600});await page.goto('/?month=2030-01&day=2030-01-21');
  await openPlan(page);
  const dialog=page.getByRole('dialog');await dialog.getByLabel('Note (optional)').fill('A short screen');
  const note=await dialog.getByLabel('Note (optional)').boundingBox(),save=await dialog.getByRole('button',{name:'Save plan'}).boundingBox();
  expect(note!.y+note!.height).toBeLessThanOrEqual(save!.y);
  expect(save!.y+save!.height).toBeLessThanOrEqual(600);
  expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
});
