import {test,expect} from '@playwright/test';

test.beforeEach(async({context,request})=>{
  await request.post('http://127.0.0.1:54329/test/reset');
  const session=await (await request.get('http://127.0.0.1:54329/test/session')).json();
  await context.addCookies([{name:'cashlendar-language',value:'en',domain:'localhost',path:'/'},{name:session.cookieName,value:session.cookieValue,domain:'localhost',path:'/'}]);
});

test('More opens family tools and remains selected inside Savings and the board',async({page},testInfo)=>{
  await page.goto('/more');
  const nav=page.getByRole('navigation',{name:'Main navigation'});
  await expect(nav.getByRole('link')).toHaveText(['Money','Accounts','More','Profile']);
  await page.screenshot({path:`/tmp/cashlendar-more-${testInfo.project.name}.png`,fullPage:true});
  await page.getByRole('link',{name:/^Savings/}).click();
  await expect(page.getByRole('heading',{name:'Savings',exact:true})).toBeVisible();
  await expect(nav.getByRole('link',{name:'More',exact:true})).toHaveAttribute('aria-current','page');
  await page.getByRole('link',{name:'More',exact:true}).filter({has:page.locator('svg')}).first().click();
  await page.getByRole('link',{name:/^Family board/}).click();
  await expect(page.getByRole('heading',{name:'Family board',exact:true})).toBeVisible();
  await expect(nav.getByRole('link',{name:'More',exact:true})).toHaveAttribute('aria-current','page');
  for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:800});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
});

test('family members share notes, checklist completion, and reminders',async({page,context,request},testInfo)=>{
  await page.goto('/board');
  await page.getByRole('button',{name:'Add to board',exact:true}).first().click();
  let dialog=page.getByRole('dialog');
  await dialog.getByLabel('Title').fill('School note');
  await dialog.getByLabel('Details (optional)').fill('Bring the permission slip');
  await dialog.getByRole('button',{name:'Save',exact:true}).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('article',{name:'School note'})).toContainText('Bring the permission slip');
  await page.getByRole('button',{name:'Add to board',exact:true}).click();
  dialog=page.getByRole('dialog');
  await dialog.getByRole('button',{name:'To-do list',exact:true}).click();
  await dialog.getByLabel('Title').fill('Shopping');
  await dialog.getByRole('button',{name:'Add task',exact:true}).click();await dialog.getByLabel('Task 1',{exact:true}).fill('Rice');
  await dialog.getByRole('button',{name:'Add task',exact:true}).click();await dialog.getByLabel('Task 2',{exact:true}).fill('Milk');
  await dialog.getByRole('button',{name:'Save',exact:true}).click();await expect(dialog).toHaveCount(0);
  const session=await (await request.get('http://127.0.0.1:54329/test/session?member=1')).json();
  await context.addCookies([{name:session.cookieName,value:session.cookieValue,domain:'localhost',path:'/'}]);await page.reload();
  await expect(page.getByRole('article',{name:'School note'})).toBeVisible();
  const list=page.getByRole('article',{name:'Shopping'});
  await list.getByRole('checkbox',{name:'Rice',exact:true}).check();
  await expect(list.getByRole('checkbox',{name:'Rice',exact:true})).toBeEnabled();
  await list.getByRole('checkbox',{name:'Milk',exact:true}).check();
  await expect(list).toContainText('2 of 2 done');
  await page.getByRole('article',{name:'School note'}).getByRole('button',{name:'Edit',exact:true}).click();
  dialog=page.getByRole('dialog');await dialog.getByLabel('Details (optional)').fill('Bring it on Friday');
  await dialog.getByRole('button',{name:'Save',exact:true}).click();await expect(dialog).toHaveCount(0);
  await page.getByRole('button',{name:'Add to board',exact:true}).click();
  dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Reminder',exact:true}).click();
  await dialog.getByLabel('Title').fill('Pay electricity');await dialog.getByLabel('Time',{exact:true}).fill('09:00');
  await dialog.getByRole('button',{name:'Save',exact:true}).click();await expect(dialog).toHaveCount(0);
  const reminder=page.getByRole('article',{name:'Pay electricity'});
  await reminder.getByRole('button',{name:'Mark complete',exact:true}).click();await expect(reminder).toContainText('Completed');
  const owner=await (await request.get('http://127.0.0.1:54329/test/session')).json();
  await context.addCookies([{name:owner.cookieName,value:owner.cookieValue,domain:'localhost',path:'/'}]);await page.reload();
  await expect(page.getByRole('article',{name:'Shopping'}).getByRole('checkbox',{name:'Rice',exact:true})).toBeChecked();
  await expect(page.getByRole('article',{name:'School note'})).toContainText('Bring it on Friday');
  await expect(page.getByRole('article',{name:'School note'})).toContainText('Updated by Test Member');
  await page.screenshot({path:`/tmp/cashlendar-board-${testInfo.project.name}.png`,fullPage:true});
  await page.getByRole('article',{name:'School note'}).getByRole('button',{name:'Delete',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Delete',exact:true}).click();
  await expect(page.getByRole('article',{name:'School note'})).toHaveCount(0);
});

test('phone reminders require each signed-in member to opt in and can be disabled',async({page,context,request})=>{
  test.skip(process.env.PUSH_E2E!=='1','Requires mock push configuration');
  await page.addInitScript(()=>{
    const matchMedia=window.matchMedia.bind(window);
    window.matchMedia=(query:string)=>query==='(display-mode: standalone)' ? {...matchMedia(query),matches:true} as MediaQueryList : matchMedia(query);
    const permission={value:'granted'};
    Object.defineProperty(window,'__pushPermission',{value:permission});
    Object.defineProperty(window,'Notification',{value:{requestPermission:async()=>permission.value,permission:'granted'},configurable:true});
    Object.defineProperty(window,'PushManager',{value:class {},configurable:true});
    const subscription={endpoint:'https://fcm.googleapis.com/fcm/send/browser-board-test',toJSON:()=>({endpoint:'https://fcm.googleapis.com/fcm/send/browser-board-test',keys:{p256dh:'A'.repeat(87),auth:'B'.repeat(22)}}),unsubscribe:async()=>{localStorage.removeItem('mock-push');return true;}};
    const registration={pushManager:{getSubscription:async()=>localStorage.getItem('mock-push') ? subscription : null,subscribe:async()=>{localStorage.setItem('mock-push','yes');return subscription;}}};
    Object.defineProperty(navigator,'serviceWorker',{value:{register:async()=>registration,getRegistration:async()=>registration,ready:Promise.resolve(registration)},configurable:true});
  });
  await page.goto('/board');
  const enable=page.getByRole('button',{name:'Enable notifications',exact:true});await expect(enable).toBeVisible();
  await page.evaluate(()=>{(window as unknown as {__pushPermission:{value:string}}).__pushPermission.value='denied';});
  await enable.click();await expect(page.locator('.phone-notifications').getByRole('alert')).toContainText('Allow notifications');
  await page.evaluate(()=>{(window as unknown as {__pushPermission:{value:string}}).__pushPermission.value='granted';});
  await enable.click();await expect(page.getByRole('button',{name:'Disable notifications'})).toBeVisible();
  await page.reload();await expect(page.getByRole('button',{name:'Disable notifications'})).toBeVisible();
  const member=await (await request.get('http://127.0.0.1:54329/test/session?member=1')).json();
  await context.addCookies([{name:member.cookieName,value:member.cookieValue,domain:'localhost',path:'/'}]);await page.reload();
  await expect(enable).toBeVisible();await enable.click();
  await expect(page.getByRole('button',{name:'Disable notifications'})).toBeVisible();
  await page.getByRole('button',{name:'Disable notifications'}).click();await expect(enable).toBeVisible();
  await page.reload();await expect(enable).toBeVisible();
});

test('the tools and board use Indonesian by default',async({page,context,request})=>{
  await context.clearCookies();
  const session=await (await request.get('http://127.0.0.1:54329/test/session')).json();
  await context.addCookies([{name:session.cookieName,value:session.cookieValue,domain:'localhost',path:'/'}]);
  await page.goto('/more');
  await expect(page.getByRole('heading',{name:'Lainnya',exact:true})).toBeVisible();
  await page.getByRole('link',{name:/^Papan keluarga/}).click();
  await expect(page.getByRole('heading',{name:'Papan keluarga',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Tambahkan ke papan',exact:true}).first().click();
  await expect(page.getByRole('dialog').getByLabel('Judul')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button',{name:'Daftar tugas',exact:true})).toBeVisible();
});

test('a newer family edit is preserved and the older draft stays available',async({page,context,request})=>{
  await page.goto('/board');
  await page.getByRole('button',{name:'Add to board',exact:true}).first().click();
  let dialog=page.getByRole('dialog');await dialog.getByLabel('Title').fill('Shared draft');
  await dialog.getByLabel('Details (optional)').fill('Original');
  await dialog.getByRole('button',{name:'Save',exact:true}).click();await expect(dialog).toHaveCount(0);
  await page.getByRole('article',{name:'Shared draft'}).getByRole('button',{name:'Edit',exact:true}).click();
  dialog=page.getByRole('dialog');await dialog.getByLabel('Details (optional)').fill('My older draft');
  const second=await context.newPage();await second.goto('/board');
  await second.getByRole('article',{name:'Shared draft'}).getByRole('button',{name:'Edit',exact:true}).click();
  await second.getByRole('dialog').getByLabel('Details (optional)').fill('Newer family edit');
  await second.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click();await expect(second.getByRole('dialog')).toHaveCount(0);
  await dialog.getByRole('button',{name:'Save',exact:true}).click();
  await expect(dialog.getByRole('alert')).toContainText('This item changed.');
  await expect(dialog.getByLabel('Details (optional)')).toHaveValue('My older draft');
  await dialog.getByRole('button',{name:'Close dialog'}).click();await page.getByRole('button',{name:'Refresh board'}).click();
  await expect(page.getByRole('article',{name:'Shared draft'})).toContainText('Newer family edit');
  expect((await request.get('/api/reminders')).status()).toBe(401);
  await second.close();
});
