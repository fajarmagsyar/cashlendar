import {test,expect} from '@playwright/test';
import ExcelJS from 'exceljs';
test.beforeEach(async({context,request})=>{
  await request.post('http://127.0.0.1:54329/test/reset');
  const {cookieName,cookieValue}=await (await request.get('http://127.0.0.1:54329/test/session')).json();
  await context.addCookies([{name:cookieName,value:cookieValue,domain:'localhost',path:'/',sameSite:'Lax'}]);
});
test('mobile Money tabs retain filters and the dock adds from any screen',async({page})=>{
  await page.setViewportSize({width:320,height:700});
  await page.goto('/?month=2026-01&day=2026-01-06');
  const tabs=page.getByRole('tablist',{name:'Money views'});
  await expect(tabs).toBeVisible();
  await tabs.getByRole('tab',{name:'List',exact:true}).click();
  await expect(page).toHaveURL(/month=2026-01/);
  await expect(page.locator('.entry-row')).toHaveCount(50);
  await expect(page.locator('.entry-row').first().getByText(/Recorded by/)).toBeVisible();
  await tabs.getByRole('tab',{name:'Charts',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Where it went'})).toBeVisible();
  await expect(page).toHaveURL(/month=2026-01/);
  await tabs.getByRole('tab',{name:'Calendar',exact:true}).click();
  await expect(page.getByRole('link',{name:/Tuesday, January 6/})).toHaveAttribute('aria-current','date');
  const nav=page.getByRole('navigation',{name:'Main navigation'});
  await expect(nav.getByRole('link')).toHaveCount(4);
  const add=nav.getByRole('button',{name:'Add transaction'});
  const box=await add.boundingBox();expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44);
  for(const name of ['Accounts','Savings','Family']) {
    await nav.getByRole('link',{name,exact:true}).click();await add.click();
    await expect(page.getByRole('dialog')).toHaveAccessibleName('Add transaction');
    await page.keyboard.press('Escape');await expect(add).toBeFocused();
  }
  await nav.getByRole('link',{name:'Money',exact:true}).click();
  await tabs.getByRole('tab',{name:'Calendar',exact:true}).focus();await page.keyboard.press('ArrowRight');
  await expect(tabs.getByRole('tab',{name:'List',exact:true})).toHaveAttribute('aria-selected','true');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('Excel export includes every matching entry and recorder beyond the visible page',async({page,context})=>{
  await page.goto('/?view=list&month=2026-01');
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export Excel'}).click();
  const download=await downloadPromise;expect(download.suggestedFilename()).toBe('cashlendar-2026-01.xlsx');
  const workbook=new ExcelJS.Workbook();await workbook.xlsx.readFile((await download.path())!);
  const transactions=workbook.getWorksheet('Transactions')!;
  expect(transactions.rowCount).toBe(56);expect(transactions.getRow(1).values).toContain('Recorded by');
  expect(transactions.getRow(2).getCell(9).value).toBe('Test Owner');
  expect(workbook.getWorksheet('Planned expenses')).toBeTruthy();
  await context.clearCookies();const response=await context.request.get('/api/export?month=2026-01');
  expect(response.status()).toBe(401);
});
