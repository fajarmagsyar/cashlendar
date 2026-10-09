import {test,expect,type Page} from '@playwright/test';

test.beforeEach(async({context,request})=>{
  await request.post('http://127.0.0.1:54329/test/reset');
  const {cookieName,cookieValue}=await (await request.get('http://127.0.0.1:54329/test/session')).json();
  await context.addCookies([{name:'cashlendar-language',value:'en',domain:'localhost',path:'/',sameSite:'Lax'},{name:cookieName,value:cookieValue,domain:'localhost',path:'/',sameSite:'Lax'}]);
});

async function openExpense(page:Page,note:string) {
  await page.goto('/?month=2026-01&day=2026-01-06');
  await page.getByRole('button',{name:'Add transaction',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await dialog.getByLabel('Amount (IDR)').fill('12500');
  await dialog.getByLabel('Account',{exact:true}).selectOption({label:'Daily cash'});
  await dialog.getByLabel('Category',{exact:true}).selectOption({label:'Food & groceries'});
  await dialog.getByLabel('Note (optional)').fill(note);
  return dialog;
}

test('a slow transaction save locks the dialog and confirms a single saved entry',async({page})=>{
  const note='One transaction from repeated submit';
  const dialog=await openExpense(page,note);
  let requests=0;
  let release!:()=>void;
  const held=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/*',async route=>{
    if(route.request().headers()['next-action']) {requests++;await held;}
    await route.continue();
  });
  try {
    await dialog.locator('form').evaluate(form=>{
      form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
      form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    });
    await expect(dialog.getByRole('button',{name:'Saving…',exact:true})).toBeDisabled({timeout:700});
    await expect(dialog.locator('.loading-animation')).toHaveCount(0);
    await expect(dialog.getByLabel('Amount (IDR)')).toBeDisabled();
    await expect(dialog.getByRole('button',{name:'Close dialog'})).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    await expect.poll(()=>requests).toBe(1);
  } finally {release();}
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('status').filter({hasText:'Transaction saved.'})).toBeVisible();
  await expect(page.getByText(note,{exact:true})).toHaveCount(1);
  await page.getByRole('button',{name:'Dismiss confirmation'}).click();
  await expect(page.getByRole('status').filter({hasText:'Transaction saved.'})).toHaveCount(0);
});

test('a failed transaction save keeps inputs and allows a successful retry and edit',async({page})=>{
  const note='Retried transaction';
  const dialog=await openExpense(page,note);
  let fail=true;
  await page.route('**/*',async route=>{
    if(fail && route.request().headers()['next-action']) {fail=false;await route.abort('failed');}
    else await route.continue();
  });
  await dialog.getByRole('button',{name:'Save transaction',exact:true}).click();
  await expect(dialog.getByRole('alert')).toContainText('Your input is still here');
  await expect(dialog.getByLabel('Note (optional)')).toHaveValue(note);
  await expect(dialog.getByLabel('Amount (IDR)')).toHaveValue('12.500');
  await expect(dialog.getByRole('button',{name:'Close dialog'})).toBeEnabled();
  await expect(page.getByRole('status').filter({hasText:'Transaction saved.'})).toHaveCount(0);
  await dialog.getByRole('button',{name:'Save transaction',exact:true}).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('status').filter({hasText:'Transaction saved.'})).toBeVisible();
  const row=page.locator('article').filter({has:page.getByText(note,{exact:true})});
  await row.getByRole('button',{name:'Edit',exact:true}).click();
  await page.getByLabel('Amount (IDR)').fill('15000');
  await page.getByRole('button',{name:'Save changes',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('status').filter({hasText:'Transaction updated.'})).toBeVisible();
  await expect(row).toContainText('15.000');
});
