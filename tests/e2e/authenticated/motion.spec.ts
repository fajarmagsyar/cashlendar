import {test,expect} from '@playwright/test';

test.beforeEach(async({context,request})=>{
  await request.post('http://127.0.0.1:54329/test/reset');
  const session=await (await request.get('http://127.0.0.1:54329/test/session')).json();
  await context.addCookies([{name:'cashlendar-language',value:'en',domain:'localhost',path:'/'},{name:session.cookieName,value:session.cookieValue,domain:'localhost',path:'/'}]);
});

test('Money selections animate to the selected tab without changing keyboard navigation',async({page})=>{
  await page.goto('/?month=2026-01&day=2026-01-06');
  const tabs=page.getByRole('tablist',{name:'Money views'}),marker=tabs.locator('.money-tab-indicator');
  for(const name of ['List','Charts','Calendar']) {
    const tab=tabs.getByRole('tab',{name,exact:true});await tab.click();
    await expect(tab).toHaveAttribute('aria-selected','true');
    await expect(async()=>{
      const indicator=await marker.boundingBox(),selected=await tab.boundingBox();
      expect(indicator).not.toBeNull();expect(selected).not.toBeNull();
      expect(Math.abs(indicator!.x-selected!.x)).toBeLessThan(2);
      expect(Math.abs(indicator!.width-selected!.width)).toBeLessThan(2);
    }).toPass({timeout:1500});
  }
  await tabs.getByRole('tab',{name:'Calendar',exact:true}).focus();await page.keyboard.press('ArrowRight');
  await expect(tabs.getByRole('tab',{name:'List',exact:true})).toHaveAttribute('aria-selected','true');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('reduced motion removes decorative movement and preserves focus and popover behavior',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/?month=2026-01&day=2026-01-06');
  await expect(page.locator('.money-tab-indicator')).toHaveCSS('transition-duration','0s');
  await page.getByRole('button',{name:'Add transaction',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await expect(dialog).toHaveCSS('animation-name','none');
  await dialog.getByRole('button',{name:'Open date picker'}).click();
  const picker=page.getByRole('dialog',{name:'Choose date'});
  await expect(picker).toBeVisible();await expect(picker).toHaveCSS('animation-name','none');
  await page.keyboard.press('Escape');await expect(picker).not.toBeVisible();
  await dialog.getByRole('button',{name:'Close dialog'}).click();await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Add transaction',exact:true})).toBeFocused();
  await page.goto('/more');
  const tool=page.getByRole('link',{name:/^Family board/});await tool.hover();
  await expect(tool).toHaveCSS('transform','none');await expect(tool).toHaveCSS('animation-name','none');
  await tool.click();await expect(page.getByRole('heading',{name:'Family board',exact:true})).toBeVisible();
});
