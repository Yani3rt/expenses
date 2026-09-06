import { test, expect } from "@playwright/test";

test("ledger controls share the dark theme without losing filtering", async ({ page }, testInfo) => {
  await page.goto("/transactions?period=all");
  const search = page.getByRole("textbox", { name: "Search transactions" });
  const toggle = page.getByRole("button", { name: /^(More filters|Filters)$/ });
  async function expectDark(locator) {
    const background = await locator.evaluate(el => getComputedStyle(el).backgroundColor);
    const rgb = background.match(/[\d.]+/g).slice(0, 3).map(Number);
    expect(Math.max(...rgb)).toBeLessThan(80);
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
