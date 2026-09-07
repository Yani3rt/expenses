import { selectTheme } from './theme-helpers.js';
import { test, expect } from "@playwright/test";

test("ledger controls share the dark theme without losing filtering", async ({ page }, testInfo) => {
  await page.goto("/transactions?period=all");
  await selectTheme(page, "classic");
  const search = page.getByRole("textbox", { name: "Search transactions" });
  const toggle = page.getByRole("button", { name: /^(More filters|Filters)$/ });
  async function expectDark(locator) {
    await expect.poll(async () => {
      const background = await locator.evaluate(el => getComputedStyle(el).backgroundColor);
      const rgb = background.match(/[\d.]+/g).slice(0, 3).map(Number);
      return Math.max(...rgb);
    }).toBeLessThan(80);
  }
  await expectDark(page.locator(".sticky-search-bar"));
  await expectDark(toggle);
  const searchBox = await search.boundingBox();
  expect(searchBox.height).toBeGreaterThanOrEqual(44);
  if (testInfo.project.name === "desktop") expect(searchBox.width).toBeGreaterThan(500);
  await toggle.click();
  const sheet = page.getByRole("dialog", { name: "Filters" });
  await expect(sheet).toBeVisible();
  await expectDark(sheet.getByRole("combobox", { name: "Month", exact: true }));
  await expectDark(sheet.getByRole("combobox", { name: "Sort", exact: true }));
  const presets = page.getByRole("group", { name: "Quick date ranges" }).filter({ visible: true });
  await expectDark(presets.getByRole("button", { name: "Last month", exact: true }));
  await presets.getByRole("button", { name: "Last month", exact: true }).click();
  await expect(page).toHaveURL(/period=last_month/);
  await expect(presets.getByRole("button", { name: "Last month", exact: true })).toHaveAttribute("aria-pressed", "true");
  if (testInfo.project.name === "mobile") await sheet.getByRole("button", { name: "Close filters" }).click();
  else await toggle.click();
  await search.fill("Dinner");
  await expect(page).toHaveURL(/q=Dinner/);
  await expect(page.getByRole("button", { name: /^Dinner Jun/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('paper ledger uses stationery forms and labels without changing Classic or filtering', async ({ page }, testInfo) => {
  await page.goto('/transactions?period=all');
  await selectTheme(page, 'classic');
  const shape = () => page.locator('.sticky-search-bar, .ledger-card, .ledger-card .expense-icon').evaluateAll(elements => elements.map(el => getComputedStyle(el).borderRadius));
  const classic = await shape();
  await page.getByRole('button', { name: 'Visual theme', exact: true }).click();
  await page.getByRole('menuitemradio', { name: 'Momentum', exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.sticky-search-bar')).toHaveCSS('border-radius', '2px');
  await expect(page.locator('.ledger-card')).toHaveCSS('border-radius', '2px');
  await expect(page.locator('.filter-results-summary')).toHaveCSS('border-radius', '2px');
  expect(await page.locator('.ledger-card').evaluate(el => getComputedStyle(el, '::before').content)).toBe('""');
  expect(await page.locator('.ledger-card .expense-copy > strong').first().evaluate(el => getComputedStyle(el).fontFamily)).toContain('Kalam');
  expect(await page.locator('.ledger-card .expense-amount').first().evaluate(el => getComputedStyle(el).fontFamily)).not.toContain('Kalam');
  await page.screenshot({ path: `/tmp/paper-ledger-${testInfo.project.name}.png`, animations: 'disabled' });
  await page.getByRole('button', { name: /^(More filters|Filters)$/ }).click();
  const filters = page.getByRole('dialog', { name: 'Filters' });
  await expect(filters).toBeVisible();
  await expect(filters.getByRole('combobox', { name: 'Sort', exact: true })).toHaveCSS('border-radius', '2px');
  await page.screenshot({ path: `/tmp/paper-ledger-filters-${testInfo.project.name}.png`, animations: 'disabled' });
  if (testInfo.project.name === 'mobile') await filters.getByRole('button', { name: 'Close filters' }).click();
  else await page.getByRole('button', { name: 'More filters' }).click();
  await page.getByRole('button', { name: 'Visual theme', exact: true }).click();
  await page.getByRole('menuitemradio', { name: 'Classic', exact: true }).click();
  expect(await shape()).toEqual(classic);
  await page.getByRole('textbox', { name: 'Search transactions' }).fill('Dinner');
  await expect(page).toHaveURL(/q=Dinner/);
  await expect(page.getByRole('button', { name: /^Dinner Jun/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('desktop category dropdown overlays the ledger without stretching filter controls', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Mobile uses an inline checkbox list.');
  await page.goto('/transactions?period=all');
  await selectTheme(page, 'classic');
  for (const theme of ['Classic', 'Momentum']) {
    await page.getByRole('button', { name: 'Visual theme', exact: true }).click();
    await page.getByRole('menuitemradio', { name: theme, exact: true }).click();
    const toggle = page.getByRole('button', { name: 'More filters', exact: true });
    await toggle.click();
    const form = page.locator('.instant-filter-card');
    const ledger = page.locator('.ledger-card');
    const before = { form: await form.boundingBox(), ledger: await ledger.boundingBox() };
    const trigger = page.locator('.category-multiselect-trigger');
    await trigger.click();
    const panel = page.locator('.category-multiselect-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveCSS('position', 'absolute');
    expect((await form.boundingBox()).height).toBe(before.form.height);
    expect((await ledger.boundingBox()).y).toBe(before.ledger.y);
    const bounds = await panel.boundingBox();
    expect(bounds.height).toBeLessThanOrEqual(320);
    expect(bounds.y).toBeGreaterThanOrEqual((await trigger.boundingBox()).y + (await trigger.boundingBox()).height);
    await panel.getByRole('checkbox', { name: 'Technology', exact: true }).click();
    await expect(page).toHaveURL(/category=tecnologia/);
    await expect(panel.getByRole('checkbox', { name: 'Technology', exact: true })).toBeChecked();
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await panel.getByRole('checkbox', { name: 'All categories', exact: true }).click();
    await expect(panel).toHaveCount(0);
    await toggle.click();
  }
});
