import { expect, test } from '@playwright/test';
import { selectTheme } from './theme-helpers.js';

for (const theme of ['classic', 'momentum']) {
  test(`${theme}: navigation follows clicks and scrolling without duplicate Ledger`, async ({ page }) => {
    await page.goto('/?range=3m&end=2026-07-31&currency=USD');
    await selectTheme(page, theme);
    const nav = page.getByRole('navigation', { name: 'Primary navigation' });
    const spending = nav.getByRole('link', { name: 'Spending', exact: true });
    const ledger = nav.getByRole('link', { name: 'Ledger', exact: true });
    await expect(spending).toHaveAttribute('aria-current', 'location');
    await nav.getByRole('button', { name: /More/ }).click();
    await expect(ledger).toHaveCount(1);
    await expect(page.locator('#more-navigation').getByRole('link', { name: 'Full ledger', exact: true })).toBeVisible();
    await ledger.click();
    await expect(page.locator('#more-navigation')).toHaveCount(0);
    await expect(ledger).toHaveClass('active');
    await expect(ledger).toHaveAttribute('aria-current', 'location');
    await expect(spending).not.toHaveClass('active');
    await expect(page).toHaveURL(/range=3m&end=2026-07-31&currency=USD#transactions$/);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect(spending).toHaveClass('active');
    await expect(ledger).not.toHaveAttribute('aria-current');
    await page.locator('#transactions').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await expect(ledger).toHaveClass('active');
    await spending.click();
    await expect(spending).toHaveClass('active');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(100);
    await page.goto('/?range=1m&end=2026-07-31#transactions');
    await expect(ledger).toHaveClass('active');
  });
}
