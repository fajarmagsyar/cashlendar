import {readFile,realpath} from 'node:fs/promises';
import {resolve} from 'node:path';
import {test,expect} from '@playwright/test';
test.beforeEach(async({context,request})=>{
  await request.post('http://127.0.0.1:54329/test/reset');
  const session=await (await request.get('http://127.0.0.1:54329/test/session')).json();
  await context.addCookies([{name:'cashlendar-language',value:'id',domain:'localhost',path:'/'},{name:session.cookieName,value:session.cookieValue,domain:'localhost',path:'/'}]);
});

test('note editor uses a compact title and a floating save action',async({page})=>{
  await page.goto('/board');
  await expect(page.locator('.fridge-empty')).toHaveText('Belum ada');
  await page.getByRole('link',{name:'Tambah catatan',exact:true}).click();
  const title=page.getByRole('textbox',{name:'Judul',exact:true});
  await expect(title).toHaveAttribute('placeholder','Judul');
  expect(await title.evaluate(element=>parseFloat(getComputedStyle(element).fontSize))).toBeLessThanOrEqual(20);
  const save=page.getByRole('button',{name:'Simpan halaman',exact:true});
  await expect(save).toHaveCSS('position','fixed');
  const box=await save.boundingBox(),viewport=page.viewportSize()!;
  expect(viewport.width-box!.x-box!.width).toBeLessThanOrEqual(32);
  expect(viewport.height-box!.y-box!.height).toBeLessThanOrEqual(56);
  await title.fill('Browser note');
  await page.getByLabel('Teks bagian 1').fill('Catatan singkat.');
  await save.click();
  await expect(page).toHaveURL('/board');
  await expect(page.getByRole('article',{name:'Browser note'})).toBeVisible();
  await page.setViewportSize({width:390,height:850});
  expect(await page.locator('.app-header .brand').evaluate(element=>parseFloat(getComputedStyle(element).fontSize))).toBeLessThanOrEqual(21);
});

test('export shows a focused loading state while preparing the selected format',async({page})=>{
  await page.goto('/?month=2026-01');
  let release!:()=>void;
  const held=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/api/export?**',async route=>{await held;await route.continue();});
  await page.getByRole('button',{name:'Ekspor',exact:true}).click();
  const dialog=page.getByRole('dialog');
  const download=page.waitForEvent('download');
  await dialog.getByRole('button',{name:/PDF/}).click();
  try {
    const status=dialog.getByRole('status');
    await expect(status).toContainText('PDF');
    await expect(status.locator('.loading-animation')).toBeVisible();
    await expect(dialog.locator('.export-options')).toHaveCount(0);
    await expect(dialog.getByRole('button',{name:'Tutup dialog'})).toBeDisabled();
  } finally {release();}
  const pdf=await download;
  expect(pdf.suggestedFilename()).toBe('cashlendar-2026-01.pdf');
  const bytes=await readFile((await pdf.path())!);
  expect(bytes.subarray(0,5).toString()).toBe('%PDF-');
  expect(bytes.toString()).toContain('%%EOF');
  await expect(dialog).toHaveCount(0);
});
test('accounts, settings, chart, exports and fridge notes work at all widths',async({page},testInfo)=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?month=2026-01&view=charts');
  await expect(page.locator('.category-pie')).toBeVisible();
  await expect(page.locator('.cashflow-svg')).toBeVisible();
  await expect(page.getByRole('button',{name:'Terapkan',exact:true})).toHaveText('');
  for(const format of ['Excel','PDF']) {
    await page.getByRole('button',{name:'Ekspor',exact:true}).click();
    const download=page.waitForEvent('download');
    await page.getByRole('dialog').getByRole('button',{name:new RegExp(format)}).click();
    expect((await download).suggestedFilename()).toMatch(format==='PDF' ? /\.pdf$/ : /\.xlsx$/);
  }
  await page.getByRole('navigation').filter({visible:true}).getByRole('link',{name:'Akun',exact:true}).click();
  await expect(page.locator('.account-card').first()).toBeVisible();
  await expect(page.getByRole('heading',{name:'Kategori',exact:true})).toHaveCount(0);
  await page.locator('.card-front .card-flip').first().click();
  await expect(page.locator('.card-rotator').first()).toHaveClass(/is-flipped/);
  await page.locator('.card-back .card-flip').first().click();
  await page.screenshot({path:`/tmp/cashlendar-cards-${testInfo.project.name}.png`,fullPage:true});
  await page.goto('/profile');
  await page.getByRole('link',{name:'Pengaturan',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Kategori',exact:true})).toBeVisible();
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await page.getByRole('button',{name:'Tambah kategori',exact:true}).click();
  await page.getByRole('dialog').getByRole('textbox').fill('Browser category refresh');
  await page.getByRole('button',{name:'Simpan kategori',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Browser category refresh',{exact:true})).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading',{name:'Profil',exact:true})).toBeVisible();
  await expect(page.getByRole('navigation').filter({visible:true})).toBeVisible();
  await page.goto('/board');
  await expect(page.getByRole('heading',{name:'Catatan Kulkas',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Tambah catatan',exact:true})).toHaveCount(1);
  await expect(page.locator('.phone-notifications')).not.toHaveAttribute('open');
  await page.locator('.phone-notifications summary').click();
  await expect(page.locator('.phone-notifications')).toHaveAttribute('open','');
  for(const path of ['/accounts','/settings','/board','/?month=2026-01&view=charts','/?month=2026-01&view=list']) {
    await page.goto(path);
    for(const width of [320,390,768,1440]) {
      await page.setViewportSize({width,height:850});
      const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:Array.from(document.querySelectorAll('main *')).filter(element=>element.getBoundingClientRect().right>innerWidth).map(element=>`${element.tagName}.${element.className}`).slice(0,10)}));
      expect(overflow.scroll<=overflow.width,`${path} at ${width}: ${JSON.stringify(overflow)}`).toBe(true);
    }
  }
  await page.setViewportSize({width:390,height:850});
  await expect(page.locator('.header-household')).not.toBeVisible();
  const brand=await page.locator('.app-header .brand').boundingBox();
  expect(Math.abs(brand!.x+brand!.width/2-195)).toBeLessThan(2);
  await page.screenshot({path:`/tmp/cashlendar-refresh-${testInfo.project.name}.png`,fullPage:true});
  expect(errors).toEqual([]);
});

test('page movement follows tab position and reverses nested navigation',async({page})=>{
  await page.goto('/');
  const dock=page.getByRole('navigation').filter({visible:true});
  await expect(dock).toHaveCSS('view-transition-name','app-navigation');
  const dockPosition=await dock.boundingBox();
  await page.evaluate(()=>{
    const recorded:string[]=[];
    const dockFrames:string[]=[];
    (window as unknown as {dockFrames:string[]}).dockFrames=dockFrames;
    (window as unknown as {motionNames:string[]}).motionNames=recorded;
    function sample(){
      for(const animation of document.getAnimations()) if(animation instanceof CSSAnimation) {
        if(!recorded.includes(animation.animationName)) recorded.push(animation.animationName);
        if(animation.animationName==='page-in-right') {
          const snapshot=getComputedStyle(document.documentElement,'::view-transition-new(app-navigation)');
          dockFrames.push(`${snapshot.animationName}/${snapshot.opacity}`);
        }
      }
      requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  });
  await page.getByRole('navigation').filter({visible:true}).getByRole('link',{name:'Akun',exact:true}).click();
  await expect(page.locator('.route-page')).toHaveAttribute('data-motion','slide-left');
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {motionNames:string[]}).motionNames)).toContain('page-in-right');
  await expect(dock).toBeVisible();
  expect(await page.evaluate(()=>getComputedStyle(document.documentElement,'::view-transition-new(app-navigation)').animationName)).toBe('none');
  const frames=await page.evaluate(()=>(window as unknown as {dockFrames:string[]}).dockFrames);
  expect(frames.length).toBeGreaterThan(0);
  expect(frames.every(frame=>frame==='none/1')).toBe(true);
  expect(await dock.boundingBox()).toEqual(dockPosition);
  await page.getByRole('navigation').filter({visible:true}).getByRole('link',{name:'Profil',exact:true}).click();
  await page.getByRole('link',{name:'Pengaturan',exact:true}).click();
  await expect(page.locator('.route-page')).toHaveAttribute('data-motion','zoom-in');
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {motionNames:string[]}).motionNames)).toContain('page-closer');
  await page.goBack();
  await expect(page.locator('.route-page')).toHaveAttribute('data-motion','zoom-out');
  await page.getByRole('navigation').filter({visible:true}).getByRole('link',{name:'Keuangan',exact:true}).click();
  await expect(page.locator('.route-page')).toHaveAttribute('data-motion','slide-right');
});


test('production PDF export includes its fonts without a build-machine path',async()=>{
  test.skip(process.env.AUTH_E2E_PRODUCTION!=='1','Production packaging check');
  const directory='.next-auth-production/server/app/api/export';
  const trace=JSON.parse(await readFile(`${directory}/route.js.nft.json`,'utf8')) as {files:string[]};
  expect(trace.files.some(file=>file.includes('pdfkit') && file.endsWith('/Helvetica.cjs'))).toBe(true);
  for(const file of trace.files.filter(file=>file.includes('/standard-fonts/'))) {
    const filename=resolve(directory,file);
    expect(await realpath(filename),`Font must use its real path: ${file}`).toBe(filename);
  }
  const bundle=await readFile(`${directory}/route.js`,'utf8');
  expect(bundle).not.toMatch(/file:\/\/[^"\s]+\/pdfkit\/js\/pdfkit\.node\.mjs/);
});
