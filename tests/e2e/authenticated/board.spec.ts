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

test('one full-page editor combines formatting, tasks, formulas, drawing and reminders for the family',async({page,context,request},testInfo)=>{
  const viewport=page.viewportSize()!;
  await page.goto('/board');
  await page.getByRole('link',{name:'New page',exact:true}).first().click();
  await expect(page.getByRole('heading',{name:'New page',exact:true})).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('navigation',{name:'Main navigation'})).toHaveCount(0);
  await page.getByLabel('Title',{exact:true}).fill('Family weekend');
  await page.getByLabel('Text block 1').fill('Plans for Saturday');
  await page.getByRole('button',{name:'Heading',exact:true}).click();
  await page.getByRole('button',{name:'Bold',exact:true}).click();
  await expect(page.getByRole('button',{name:'Bold',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Checklist',exact:true}).click();
  await page.getByLabel('Task 1',{exact:true}).fill('Rice');
  await page.getByRole('button',{name:'Add task',exact:true}).click();await page.getByLabel('Task 2',{exact:true}).fill('Milk');
  await page.getByRole('button',{name:'Table',exact:true}).click();
  await page.getByLabel('Cell A1',{exact:true}).fill('10');await page.getByLabel('Cell B1',{exact:true}).fill('20');await page.getByLabel('Cell C1',{exact:true}).fill('=SUM(A1:B1)');
  await page.getByRole('button',{name:'Add row',exact:true}).click();await page.getByRole('button',{name:'Add column',exact:true}).click();
  await expect(page.getByLabel('Cell C1',{exact:true})).toHaveValue('30');
  await page.getByLabel('Cell C2',{exact:true}).fill('=1/0');await page.getByLabel('Title',{exact:true}).focus();
  await expect(page.getByLabel('Cell C2',{exact:true})).toHaveValue('#DIV/0!');
  await page.getByRole('button',{name:'Drawing',exact:true}).click();
  const canvas=page.getByRole('img',{name:'Drawing canvas'});await canvas.scrollIntoViewIfNeeded();
  const box=(await canvas.boundingBox())!;
  await page.mouse.move(box.x+40,box.y+40);await page.mouse.down();await page.mouse.move(box.x+100,box.y+80,{steps:8});await page.mouse.up();
  await expect(canvas.locator('polyline')).toHaveCount(1);
  await page.getByRole('button',{name:'Undo stroke',exact:true}).click();await expect(canvas.locator('polyline')).toHaveCount(0);
  await page.mouse.move(box.x+40,box.y+40);await page.mouse.down();await page.mouse.move(box.x+110,box.y+70,{steps:8});await page.mouse.up();
  await expect(canvas.locator('polyline')).toHaveCount(1);
  await page.getByLabel('Add a reminder',{exact:true}).check();await page.getByLabel('Time',{exact:true}).fill('09:00');
  for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.setViewportSize(viewport);
  await page.screenshot({path:`/tmp/cashlendar-board-editor-${testInfo.project.name}.png`,fullPage:true});
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect(page).toHaveURL('/board');
  const card=page.getByRole('article',{name:'Family weekend'});
  await expect(card).toContainText('Plans for Saturday');await expect(card.locator('polyline')).toHaveCount(1);
  await expect(card.getByRole('cell',{name:'30',exact:true})).toBeVisible();
  const session=await (await request.get('http://127.0.0.1:54329/test/session?member=1')).json();
  await context.addCookies([{name:session.cookieName,value:session.cookieValue,domain:'localhost',path:'/'}]);await page.reload();
  await card.getByRole('checkbox',{name:'Rice',exact:true}).check();await expect(card.getByRole('checkbox',{name:'Rice',exact:true})).toBeEnabled();
  await card.getByRole('checkbox',{name:'Milk',exact:true}).check();await expect(card).toContainText('2 of 2 done');
  await card.getByRole('button',{name:'Mark complete',exact:true}).click();await expect(card).toContainText('Completed');
  await card.getByRole('link',{name:'Edit',exact:true}).click();
  await expect(page.getByLabel('Cell C1',{exact:true})).toHaveValue('30');
  await page.getByLabel('Cell C1',{exact:true}).focus();await expect(page.getByLabel('Cell C1',{exact:true})).toHaveValue('=SUM(A1:B1)');
  await expect(page.getByRole('img',{name:'Drawing canvas'}).locator('polyline')).toHaveCount(1);
  await page.getByLabel('Text block 1').fill('Bring it on Friday');
  await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page).toHaveURL('/board');
  const owner=await (await request.get('http://127.0.0.1:54329/test/session')).json();
  await context.addCookies([{name:owner.cookieName,value:owner.cookieValue,domain:'localhost',path:'/'}]);await page.reload();
  await expect(card.getByRole('checkbox',{name:'Rice',exact:true})).toBeChecked();
  await expect(card).toContainText('Bring it on Friday');await expect(card).toContainText('Updated by Test Member');await expect(card).toContainText('Completed');
  await page.getByRole('searchbox',{name:'Search pages'}).fill('not on this board');await expect(card).toHaveCount(0);
  await page.getByRole('searchbox',{name:'Search pages'}).fill('Friday');await expect(card).toBeVisible();
  await page.screenshot({path:`/tmp/cashlendar-board-${testInfo.project.name}.png`,fullPage:true});
  await card.getByRole('button',{name:'Delete',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Delete',exact:true}).click();await expect(card).toHaveCount(0);
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

test('the tools and full-page editor use Indonesian by default',async({page,context,request})=>{
  await context.clearCookies();const session=await (await request.get('http://127.0.0.1:54329/test/session')).json();
  await context.addCookies([{name:session.cookieName,value:session.cookieValue,domain:'localhost',path:'/'}]);await page.goto('/more');
  await expect(page.getByRole('heading',{name:'Lainnya',exact:true})).toBeVisible();await page.getByRole('link',{name:/^Papan keluarga/}).click();
  await expect(page.getByRole('heading',{name:'Papan keluarga',exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Halaman baru',exact:true}).first().click();
  await expect(page.getByLabel('Judul',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Daftar tugas',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Tabel',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Gambar',exact:true})).toBeVisible();
});

test('a newer family edit is preserved and the older full-page draft stays available',async({page,context,request})=>{
  await page.goto('/board');await page.getByRole('link',{name:'New page',exact:true}).first().click();await page.getByLabel('Title',{exact:true}).fill('Shared draft');await page.getByLabel('Text block 1').fill('Original');
  await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page).toHaveURL('/board');
  await page.getByRole('article',{name:'Shared draft'}).getByRole('link',{name:'Edit',exact:true}).click();await expect(page.getByRole('heading',{name:'Edit page',exact:true})).toBeVisible();await page.getByLabel('Text block 1').fill('My older draft');await expect(page.getByLabel('Text block 1')).toHaveValue('My older draft');
  const second=await context.newPage();await second.goto('/board');await second.getByRole('article',{name:'Shared draft'}).getByRole('link',{name:'Edit',exact:true}).click();await expect(second.getByRole('heading',{name:'Edit page',exact:true})).toBeVisible();
  await second.getByLabel('Text block 1').fill('Newer family edit');await second.getByRole('button',{name:'Save',exact:true}).click();await expect(second).toHaveURL('/board');
  await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('.board-editor').getByRole('alert')).toContainText('This item changed.');await expect(page.getByLabel('Text block 1')).toHaveValue('My older draft');
  page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Family board',exact:true}).click();await expect(page.getByLabel('Text block 1')).toHaveValue('My older draft');
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Family board',exact:true}).click();
  await expect(page.getByRole('article',{name:'Shared draft'})).toContainText('Newer family edit');expect((await request.get('/api/reminders')).status()).toBe(401);await second.close();
});

test('failed saves and leaving a page preserve unsaved input',async({page})=>{
  const hydrationErrors:string[]=[];page.on('console',message=>{if(/hydrated|hydration/i.test(message.text())) hydrationErrors.push(message.text());});
  await page.goto('/board/new');await page.getByLabel('Title',{exact:true}).fill('Keep my page');await page.getByLabel('Text block 1').fill('Keep this writing');
  await page.route('**/board/new',route=>route.request().method()==='POST' ? route.abort() : route.continue());
  await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('.board-editor').getByRole('alert')).toBeVisible();await expect(page.getByLabel('Text block 1')).toHaveValue('Keep this writing');
  page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Family board',exact:true}).click();await expect(page).toHaveURL('/board/new');
  await page.unroute('**/board/new');await page.getByRole('button',{name:'Save page',exact:true}).click();await expect(page).toHaveURL('/board');await expect(page.getByRole('article',{name:'Keep my page'})).toContainText('Keep this writing');expect(hydrationErrors).toEqual([]);
});

test('block ordering, destructive controls and drawing tools work with keyboard and reduced motion',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/board/new');
  await page.getByLabel('Title',{exact:true}).fill('Editor tools');await page.getByLabel('Text block 1').fill('First paragraph');
  await page.getByRole('button',{name:'Italic',exact:true}).press('Enter');await expect(page.getByRole('button',{name:'Italic',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Text',exact:true}).click();await page.getByLabel('Text block 2').fill('Second paragraph');
  await page.getByRole('button',{name:'Move block 2 up'}).press('Enter');await expect(page.getByLabel('Text block 1')).toHaveValue('Second paragraph');
  await page.getByRole('button',{name:'Move block 1 down'}).press('Enter');await expect(page.getByLabel('Text block 1')).toHaveValue('First paragraph');
  page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Remove block 2',exact:true}).click();await expect(page.getByLabel('Text block 2')).toBeVisible();
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Remove block 2',exact:true}).click();await expect(page.getByLabel('Text block 2')).toHaveCount(0);
  await page.getByRole('button',{name:'Table',exact:true}).click();await page.getByLabel('Cell A4',{exact:true}).fill('Keep this row');
  page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Remove row',exact:true}).click();await expect(page.getByLabel('Cell A4',{exact:true})).toHaveValue('Keep this row');
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Remove row',exact:true}).click();await expect(page.getByLabel('Cell A4',{exact:true})).toHaveCount(0);
  await page.getByLabel('Cell C1',{exact:true}).fill('Keep this column');page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Remove column',exact:true}).click();await expect(page.getByLabel('Cell C1',{exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Drawing',exact:true}).click();await page.getByRole('button',{name:'Red pen',exact:true}).click();await page.getByLabel('Pen width').selectOption('8');
  const canvas=page.getByRole('img',{name:'Drawing canvas'});
  async function draw(){await canvas.scrollIntoViewIfNeeded();const box=(await canvas.boundingBox())!;await page.mouse.move(box.x+40,box.y+40);await page.mouse.down();await page.mouse.move(box.x+100,box.y+70,{steps:5});await page.mouse.up();}
  await draw();await expect(canvas.locator('polyline')).toHaveAttribute('stroke','#b23b3b');await expect(canvas.locator('polyline')).toHaveAttribute('stroke-width','8');
  await page.getByRole('button',{name:'Eraser',exact:true}).click();await canvas.locator('polyline').dispatchEvent('pointerdown',{pointerId:1,pointerType:'mouse',button:0});await expect(canvas.locator('polyline')).toHaveCount(0);
  await page.getByRole('button',{name:'Blue pen',exact:true}).click();await draw();await expect(canvas.locator('polyline')).toHaveCount(1);
  page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Clear',exact:true}).click();await expect(canvas.locator('polyline')).toHaveCount(1);
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Clear',exact:true}).click();await expect(canvas.locator('polyline')).toHaveCount(0);
  expect(await page.locator('.page-block').first().evaluate(element=>getComputedStyle(element).animationName)).toBe('none');
  await page.getByRole('button',{name:'Save page',exact:true}).press('Enter');await expect(page).toHaveURL('/board');await expect(page.getByRole('article',{name:'Editor tools'})).toContainText('First paragraph');
});

test('changing only a reminder calendar date marks the page dirty and prompts before leaving',async({page})=>{
  await page.goto('/board/new');await page.getByLabel('Title',{exact:true}).fill('Date change');await page.getByLabel('Add a reminder',{exact:true}).check();
  await page.getByRole('button',{name:'Save page',exact:true}).click();await expect(page).toHaveURL('/board');
  await page.getByRole('article',{name:'Date change'}).getByRole('link',{name:'Edit',exact:true}).click();await expect(page.getByRole('heading',{name:'Edit page',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Open date picker',exact:true}).click();
  const calendar=page.locator('.date-popover');const day=calendar.locator('.date-days button[aria-pressed="false"]:not(:disabled)').first();
  await day.click();await expect(page.getByText('Unsaved changes',{exact:true})).toBeVisible();
  page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Family board',exact:true}).click();await expect(page.getByRole('heading',{name:'Edit page',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Save page',exact:true}).click();await expect(page).toHaveURL('/board');
});
