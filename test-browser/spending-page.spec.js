import { chooseOption } from './select-helpers.js';
import { selectTheme } from './theme-helpers.js';
import { test, expect } from "@playwright/test";

test("spending stays compact and its month picker is readable and navigates", async ({ page }) => {
  await page.goto("/spending?month=2026-07");
  await selectTheme(page, "classic");
  await expect(page.getByRole("heading", { name: "Spending in July 2026", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Category activity", exact: true })).toHaveCount(0);
  const picker = page.getByRole("combobox", { name: "Spending month" });
  await expect(picker).toHaveText("July 2026");
  const appearance = await picker.evaluate((element) => {
    const style = getComputedStyle(element);
    const channels = (value) => value.match(/[\d.]+/g).slice(0, 3).map(Number);
    const luminance = (value) => channels(value).map(channel => {
      const c = channel / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
    const foreground = luminance(style.color);
    const background = luminance(style.backgroundColor);
    return {
      contrast: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
      background,
      height: element.getBoundingClientRect().height,
    };
  });
  expect(appearance.background).toBeLessThan(0.1);
  expect(appearance.contrast).toBeGreaterThanOrEqual(4.5);
  expect(appearance.height).toBeGreaterThanOrEqual(44);
  await chooseOption(page, picker, "2026-06");
  await expect(page).toHaveURL(/month=2026-06/);
  await expect(page.getByRole("heading", { name: "Spending in June 2026", exact: true })).toBeVisible();
  await chooseOption(page, picker, "all");
  await expect(page.getByRole("heading", { name: "All spending", exact: true })).toBeVisible();
  await expect(picker).toHaveText("All time");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Momentum spending labels use handwriting without changing numeric fonts or Classic', async ({ page }, testInfo) => {
  await page.goto('/spending?month=2026-07');
  await selectTheme(page, 'classic');
  const selectors = ['.spending-page-header .label', '.spending-summary-metrics .label', '.category-comparison-head .label', '.category-comparison-name strong', '.category-comparison-period > span', '.header-month-picker .custom-select-trigger'];
  const fonts = () => page.evaluate(selectors => selectors.map(selector => getComputedStyle(document.querySelector(selector)).fontFamily), selectors);
  const classicFonts = await fonts();
  const metricAppearance = () => page.locator('.spending-summary-metrics > .metric').evaluateAll(cards => cards.map(card => {
    const style = getComputedStyle(card);
    return [style.backgroundColor, style.borderRadius, style.boxShadow, getComputedStyle(card, '::after').content];
  }));
  const classicCards = await metricAppearance();
  const categoryIcon = page.locator('.category-comparison-icon').first();
  await expect(categoryIcon).toHaveCSS('border-radius', '12px');
  await selectTheme(page, 'momentum');
  await page.evaluate(() => document.fonts.ready);
  for (const font of await fonts()) expect(font).toContain('Kalam');
  for (const selector of ['.metric > strong', '.category-comparison-period > strong', '.category-comparison-delta > strong']) {
    expect(await page.locator(selector).first().evaluate(el => getComputedStyle(el).fontFamily)).not.toContain('Kalam');
  }
  await expect(page.locator('.metric > strong').first()).toHaveText('$597.84');
  const cards = page.locator('.spending-summary-metrics > .metric');
  for (const card of await cards.all()) {
    await expect(card).toHaveCSS('border-radius', '2px');
    expect(await card.evaluate(el => getComputedStyle(el, '::before').content)).toBe('""');
    expect(await card.evaluate(el => getComputedStyle(el, '::after').content)).toBe('none');
  }
  await expect(cards.first().locator('.metric-icon')).toBeHidden();
  for (const icon of await page.locator('.category-comparison-icon').all()) {
    await expect(icon).toHaveCSS('border-radius', '2px');
    await expect(icon).toHaveCSS('border-top-width', '1px');
    await expect(icon).toHaveCSS('width', '36px');
    await expect(icon).toHaveCSS('height', '40px');
  }
  await page.screenshot({ path: `/tmp/spending-fonts-${testInfo.project.name}.png`, animations: 'disabled' });
  await chooseOption(page, page.getByRole('combobox', { name: 'Spending month' }), 'all');
  await expect(page.getByRole('heading', { name: 'All spending', exact: true })).toBeVisible();
  await expect(categoryIcon).toHaveCSS('border-radius', '2px');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await selectTheme(page, 'classic');
  await expect(categoryIcon).toHaveCSS('border-radius', '12px');
  expect(await fonts()).toEqual(classicFonts);
  expect(await metricAppearance()).toEqual(classicCards);
});
