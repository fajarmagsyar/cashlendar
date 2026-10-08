import {test,expect} from '@playwright/test';

test.beforeEach(async({context,request})=>{
  await request.post('http://127.0.0.1:54329/test/reset');
  const {cookieName,cookieValue}=await (await request.get('http://127.0.0.1:54329/test/session')).json();
  await context.addCookies([{name:'cashlendar-language',value:'en',domain:'localhost',path:'/',sameSite:'Lax'},{name:cookieName,value:cookieValue,domain:'localhost',path:'/',sameSite:'Lax'}]);
});

test('Indonesian preference persists across server pages and transaction dialogs',async({page})=>{
  await page.goto('/settings');
  await page.getByLabel('Language',{exact:true}).selectOption('id');
  await expect(page.getByRole('heading',{name:'Pengaturan',exact:true})).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang','id');
  await page.reload();
  await expect(page.getByLabel('Bahasa',{exact:true})).toHaveValue('id');
  await page.goto('/?month=2026-01&day=2026-01-06');
  await expect(page.getByRole('tab',{name:'Kalender',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Januari 2026',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Tambah transaksi',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Tambah transaksi'});
  await dialog.getByLabel('Jumlah (IDR)').fill('12500');
  await dialog.getByLabel('Akun',{exact:true}).selectOption({label:'Daily cash'});
  await dialog.getByLabel('Kategori',{exact:true}).selectOption({label:'Food & groceries'});
  await dialog.getByLabel('Catatan (opsional)').fill('Belanja tes bahasa');
  await dialog.getByLabel('Jumlah (IDR)').fill('1.25');
  await dialog.getByRole('button',{name:'Simpan transaksi'}).click();
  await expect(dialog.getByLabel('Jumlah (IDR)')).toHaveAttribute('aria-invalid','true');
  await expect(dialog.getByText('Isi jumlah rupiah bulat.',{exact:true})).toBeVisible();
  await dialog.getByLabel('Jumlah (IDR)').fill('12500');
  await dialog.getByRole('button',{name:'Simpan transaksi'}).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('status').filter({hasText:'Transaksi disimpan.'})).toBeVisible();
  await expect(page.getByText('Belanja tes bahasa',{exact:true})).toBeVisible();
  await page.goto('/accounts');
  await expect(page.getByRole('heading',{name:'Akun',exact:true})).toBeVisible();
  await page.goto('/settings');
  await page.getByLabel('Bahasa',{exact:true}).selectOption('en');
  await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
});

test('landing page switches languages while preserving an invitation destination',async({page,context})=>{
  await context.clearCookies();
  const token='a'.repeat(64);
  await page.goto(`/login?next=${encodeURIComponent(`/invite?token=${token}`)}`);
  await expect(page.getByLabel('Bahasa',{exact:true})).toHaveValue('id');
  await page.getByLabel('Bahasa',{exact:true}).selectOption('en');
  await page.getByLabel('Language',{exact:true}).selectOption('id');
  await expect(page.getByRole('heading',{level:1})).toContainText('Belanja hari ini.');
  await expect(page.getByRole('button',{name:'Lanjutkan dengan Google'})).toBeVisible();
  await expect(page.getByText('Data contoh',{exact:true})).toHaveCount(2);
  await expect(page).toHaveURL(new RegExp(`next=${encodeURIComponent(`/invite?token=${token}`)}`));
  for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.reload();
  await expect(page.getByRole('heading',{level:1})).toContainText('Belanja hari ini.');
  await page.setViewportSize({width:test.info().project.name==='mobile' ? 390 : 1440,height:900});
  await page.screenshot({path:`test-results/landing-id-${test.info().project.name}.png`,fullPage:true});
});
