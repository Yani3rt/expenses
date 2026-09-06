import { expect, test } from '@playwright/test';

test('a completely empty database renders an honest empty workspace', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Spending', exact: true })).toBeVisible();
  await expect(page.getByTestId('workspace-total')).toBeVisible();
  await expect(page.getByTestId('workspace-transaction')).toHaveCount(0);
  await expect(page.getByText('No matching transactions', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Latest activity', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.getByText('No matching transactions', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
