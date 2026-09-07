import { selectTheme } from './theme-helpers.js';
import { expect, test } from '@playwright/test';

test('workspace is complete, dark, and operable on a narrow screen', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?range=1m&end=2026-07-31');
  await selectTheme(page, 'classic');
  await expect(page.getByTestId('workspace-total')).toHaveText('$502.84');
  await expect(page.getByRole('button', { name: '1Y', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous period' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  expect((await page.locator('.trend-y-axis span').first().boundingBox()).height).toBeGreaterThanOrEqual(10);
  const dark = await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
  expect(dark).toContain('dark');
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.getByTestId('workspace-total')).toHaveText('$2,296.59');
  const row = page.getByTestId('workspace-transaction').filter({ hasText: 'Tech accessory' });
  await row.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Tech accessory');
  const box = await dialog.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.width).toBeLessThanOrEqual(page.viewportSize().width);
  await dialog.getByRole('button', { name: 'Close transaction details' }).click();
  await expect(row).toBeFocused();
  expect(errors).toEqual([]);
});

test('phone category totals and additional views remain accessible by keyboard', async ({ page }) => {
  await page.goto('/?range=1m&end=2026-07-31');
  const categories = page.locator('.mobile-categories');
  await categories.getByRole('button', { name: /^Categories/ }).press('Enter');
  await expect(categories.getByRole('button', { name: 'Filter by Travel' })).toContainText('$254.50');
  const menu = page.getByRole('button', { name: 'More', exact: true });
  await menu.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Category analysis', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
});
