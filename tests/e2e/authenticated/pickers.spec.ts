import { test, expect } from '@playwright/test';
const fixtureUrl = process.env.PICKER_FIXTURE_URL || 'http://127.0.0.1:54329';

test.beforeEach(async ({ context, request }) => {
  await request.post(`${fixtureUrl}/test/reset`);
  const { cookieName, cookieValue } = await (await request.get(`${fixtureUrl}/test/session`)).json();
  await context.addCookies([{name:'cashlendar-language',value:'en',domain:'localhost',path:'/',sameSite:'Lax'},{ name: cookieName, value: cookieValue, domain: 'localhost', path: '/', sameSite: 'Lax' }]);
});

test('select menus use the app theme and retain filtering and keyboard selection', async ({ page }) => {
  await page.goto('/?month=2026-01&day=2026-01-06');
  const accounts = page.getByRole('combobox', { name: 'Filter by account' });
  await expect(accounts).toHaveCSS('appearance', 'base-select', { timeout: 3000 });
  await accounts.click();
  await expect(accounts.getByRole('option', { name: 'Daily cash', exact: true })).toBeVisible();
  await page.screenshot({ path: `test-results/select-picker-${test.info().project.name}.png`, fullPage: true });
  await accounts.getByRole('option', { name: 'Daily cash', exact: true }).click();
  await expect(accounts).not.toHaveValue('');
  await accounts.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('Home');
  await page.keyboard.press('Enter');
  await expect(accounts).toHaveValue('');
});

test('date picker selects dates, supports keyboard navigation and respects date limits', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?month=2026-01&day=2026-01-06');
  await page.getByRole('button', { name: 'Add transaction', exact: true }).click();
  const entry = page.getByRole('dialog', { name: 'Add transaction' });
  await entry.getByRole('button', { name: 'Open date picker' }).click({ timeout: 3000 });
  const picker = page.getByRole('dialog', { name: 'Choose date' });
  await expect(picker).toBeVisible();
  await expect(picker.getByRole('heading')).toHaveText('January 2026');
  await page.screenshot({ path: `test-results/date-picker-${test.info().project.name}.png`, fullPage: true });
  await picker.getByRole('button', { name: 'January 15, 2026', exact: true }).click();
  await expect(entry.getByLabel('Date', { exact: true })).toHaveValue('2026-01-15');
  await expect(picker).not.toBeVisible();
  await entry.getByRole('button', { name: 'Open date picker' }).click();
  await expect(picker.getByRole('button', { name: 'January 15, 2026', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(picker.getByRole('button', { name: 'January 16, 2026', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(entry.getByLabel('Date', { exact: true })).toHaveValue('2026-01-16');
  await entry.getByRole('button', { name: 'Open date picker' }).click();
  await page.keyboard.press('Escape');
  await expect(picker).not.toBeVisible();
  await expect(entry).toBeVisible();
  await expect(entry.getByRole('button', { name: 'Open date picker' })).toBeFocused();
  await entry.getByRole('button', { name: 'Open date picker' }).click();
  await picker.getByRole('button', { name: 'Today', exact: true }).click();
  const today = await entry.getByLabel('Date', { exact: true }).getAttribute('max');
  await expect(entry.getByLabel('Date', { exact: true })).toHaveValue(today!);
  await entry.getByRole('button', { name: 'Open date picker' }).click();
  await expect(picker.getByRole('button', { name: 'Next month' })).toBeDisabled();
  await expect.poll(() => picker.evaluate(element => {
    const box = element.getBoundingClientRect();
    return box.left >= 0 && box.right <= window.innerWidth && box.bottom <= window.innerHeight;
  })).toBe(true);
  await page.keyboard.press('Escape');
  await entry.getByLabel('Date', { exact: true }).fill('2026-01-20');
  await expect(entry.getByLabel('Date', { exact: true })).toHaveValue('2026-01-20');
  expect(errors).toEqual([]);
});
