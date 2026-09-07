import { selectTheme } from './theme-helpers.js';
import { expect, test } from '@playwright/test';

const route = '/?range=1m&end=2026-07-31';

test('theme is optional, persistent, and preserves financial workflows', async ({ page }) => {
  await page.goto(route);
  const selector = page.getByRole('button', { name: 'Visual theme', exact: true });
  await expect(selector).toHaveAttribute('data-theme-value', 'momentum');
  await selectTheme(page, 'classic');
  const originalSurface = await page.locator('html').evaluate(el => getComputedStyle(el).getPropertyValue('--surface'));
  await selectTheme(page, 'momentum');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'momentum');
  await expect(page.getByTestId('workspace-total')).toHaveText('$502.84');
  await expect(page).toHaveURL(route);
  await page.reload();
  await expect(selector).toHaveAttribute('data-theme-value', 'momentum');
  await page.getByRole('button', { name: '1W', exact: true }).click();
  await expect(page.getByTestId('workspace-total')).toHaveText('$108.09');
  await page.getByTestId('workspace-transaction').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await selectTheme(page, 'classic');
  expect(await page.locator('html').evaluate(el => getComputedStyle(el).getPropertyValue('--surface'))).toBe(originalSurface);
  await page.reload();
  await expect(selector).toHaveAttribute('data-theme-value', 'classic');
});

test('Momentum fits the viewport and supports reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route);
  await selectTheme(page, 'momentum');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const control = page.getByRole('button', { name: 'Visual theme', exact: true });
  const bounds = await control.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
  expect(await page.locator('.category-row em').first().evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.screenshot({ path: `/tmp/momentum-${test.info().project.name}.png`, fullPage: true, animations: 'disabled' });
});

test('blocked local storage does not break theme switching', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage unavailable'); };
    Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); };
  });
  await page.goto(route);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'momentum');
  await selectTheme(page, 'classic');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'classic');
  await expect(page.getByTestId('workspace-total')).toHaveText('$502.84');
});

test('theme persists across existing routes and synchronizes tabs', async ({ page, context }) => {
  await page.goto(route);
  await selectTheme(page, 'momentum');
  for (const path of ['/spending', '/transactions', '/people', '/status']) {
    await page.goto(path);
    await expect(page.getByRole('button', { name: 'Visual theme', exact: true })).toHaveAttribute('data-theme-value', 'momentum');
    await expect(page.locator('main')).toBeVisible();
    await page.screenshot({ path: `/tmp/paper-route-${path.slice(1)}-${test.info().project.name}.png`, animations: 'disabled' });
  }
  const other = await context.newPage();
  await other.goto('/status');
  await selectTheme(other, 'classic');
  await expect(page.getByRole('button', { name: 'Visual theme', exact: true })).toHaveAttribute('data-theme-value', 'classic');
  await other.close();
});

test('theme control remains reachable at narrow and tablet widths', async ({ page }) => {
  await page.goto(route);
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['classic', 'momentum']) {
      const selector = page.getByRole('button', { name: 'Visual theme', exact: true });
      await selectTheme(page, theme);
      const box = await selector.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});

test('paper theme uses light surfaces, local handwriting, and readable detail', async ({ page }, testInfo) => {
  await page.goto(route);
  await selectTheme(page, 'classic');
  const classic = await page.locator('.analysis-panel').evaluate(el => {
    const s = getComputedStyle(el);
    return [s.backgroundColor, s.borderRadius, s.padding, s.boxShadow];
  });
  await selectTheme(page, 'momentum');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.locator('html').evaluate(el => getComputedStyle(el).colorScheme)).toBe('light');
  expect(await page.locator('h1').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Kalam');
  expect(await page.evaluate(() => document.fonts.check('700 48px Kalam'))).toBe(true);
  expect(await page.getByTestId('workspace-total').evaluate(el => getComputedStyle(el).fontFamily)).not.toContain('Kalam');
  await page.screenshot({ path: `/tmp/paper-overview-${testInfo.project.name}.png`, animations: 'disabled' });
  await page.getByTestId('workspace-transaction').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').locator('.selected-transaction')).toContainText('$12.99');
  await expect(page.getByRole('dialog').locator('canvas').first()).toBeVisible();
  expect(await page.locator('.selected-transaction-main h3').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Kalam');
  expect(await page.locator('.selected-transaction .label').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Kalam');
  expect(await page.locator('.selected-transaction-main > strong').evaluate(el => getComputedStyle(el).fontFamily)).not.toContain('Kalam');
  const summaryTiles = page.locator('.transaction-detail-summary > div');
  await expect(summaryTiles).toHaveCount(4);
  for (const tile of await summaryTiles.all()) await expect(tile).toHaveCSS('border-radius', '0px');
  expect(await summaryTiles.first().locator('span').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Kalam');
  await expect(page.getByRole('dialog')).toHaveCSS('opacity', '1');
  await expect(page.locator('.transaction-dialog-backdrop')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: `/tmp/paper-dialog-${testInfo.project.name}.png`, animations: 'disabled' });
  await page.keyboard.press('Escape');
  await selectTheme(page, 'classic');
  expect(await page.locator('.analysis-panel').evaluate(el => {
    const s = getComputedStyle(el);
    return [s.backgroundColor, s.borderRadius, s.padding, s.boxShadow];
  })).toEqual(classic);
  expect(await page.locator('html').evaluate(el => getComputedStyle(el).colorScheme)).toBe('dark');
  await page.getByTestId('workspace-transaction').first().click();
  await expect(page.locator('.transaction-detail-summary > div').first()).toHaveCSS('border-radius', '14px');
  expect(await page.locator('.selected-transaction-main h3').evaluate(el => getComputedStyle(el).fontFamily)).not.toContain('Kalam');
  await page.keyboard.press('Escape');
});

test('custom theme menu supports keyboard selection and dismissal', async ({ page }, testInfo) => {
  await page.goto(route);
  const trigger = page.getByRole('button', { name: 'Visual theme', exact: true });
  await selectTheme(page, 'classic');
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitemradio', { name: 'Classic', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('data-theme-value', 'momentum');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(page.getByRole('menuitemradio', { name: 'Momentum', exact: true })).toHaveAttribute('aria-checked', 'true');
  await page.screenshot({ path: `/tmp/theme-picker-${testInfo.project.name}.png`, animations: 'disabled' });
  await page.keyboard.press('Home');
  await expect(page.getByRole('menuitemradio', { name: 'Classic', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await page.keyboard.press('Tab');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await page.getByRole('heading', { name: 'Spending', exact: true }).click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});


test('paper load more retains pagination', async ({ page }) => {
  await page.goto('/?range=all&end=2026-07-31');
  const button = page.getByRole('button', { name: 'Load more', exact: true });
  await expect(button).toBeVisible();
  await expect(button).toHaveCSS('border-radius', '2px');
  expect(await button.evaluate(el => getComputedStyle(el).fontFamily)).toContain('Kalam');
  await button.screenshot({ path: '/tmp/paper-load-more.png' });
  const rows = page.getByTestId('workspace-transaction');
  const before = await rows.count();
  await button.click();
  await expect.poll(() => rows.count()).toBeGreaterThan(before);
});

test('receipt detective appears only on empty Momentum trends', async ({ page }) => {
  await page.goto('/?range=1m&end=2026-09-07');
  const character = page.locator('.trend-empty-character');
  await expect(character).toBeVisible();
  await expect.poll(() => character.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
  await expect(page.getByText('No spending in this period.', { exact: true })).toBeVisible();
  await page.locator('.trend-empty').screenshot({ path: '/tmp/receipt-empty-state.png' });
  await selectTheme(page, 'classic');
  await expect(character).toBeHidden();
  await selectTheme(page, 'momentum');
  await page.getByRole('button', { name: 'Latest activity', exact: true }).click();
  await expect(character).toHaveCount(0);
  await expect(page.locator('.trend-plot')).toBeVisible();
});

test('desktop desk details stay decorative and disappear in Classic and narrow layouts', async ({ page }) => {
  await page.setViewportSize({ width: 1563, height: 1302 });
  await page.goto('/?range=1m&end=2026-09-07');
  const desk = page.locator('.desk-details');
  await expect(desk).toBeVisible();
  await expect(desk).toHaveAttribute('aria-hidden', 'true');
  await expect(desk).toHaveCSS('pointer-events', 'none');
  await page.screenshot({ path: '/tmp/momentum-desk.png', animations: 'disabled' });
  await page.getByRole('button', { name: 'Latest activity', exact: true }).click();
  await expect(page.locator('.trend-plot')).toBeVisible();
  await selectTheme(page, 'classic');
  await expect(desk).toBeHidden();
  await selectTheme(page, 'momentum');
  for (const width of [1280, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(desk).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('mobile heading doodle stays clear of the date controls', async ({ page }) => {
  await page.goto('/?range=3m&end=2026-09-07');
  const doodle = page.locator('.mobile-heading-doodle');
  for (const width of [320, 390, 472, 700]) {
    await page.setViewportSize({ width, height: 1302 });
    await expect(doodle).toBeVisible();
    const art = await doodle.boundingBox();
    for (const selector of ['.workspace-heading h1', '.period-navigation']) {
      const control = await page.locator(selector).boundingBox();
      expect(art.x >= control.x + control.width || art.x + art.width <= control.x || art.y >= control.y + control.height || art.y + art.height <= control.y).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 472, height: 1302 });
  await page.locator('.workspace-heading').screenshot({ path: '/tmp/mobile-heading-doodle.png' });
  await selectTheme(page, 'classic');
  await expect(doodle).toBeHidden();
  await selectTheme(page, 'momentum');
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(doodle).toBeHidden();
});
