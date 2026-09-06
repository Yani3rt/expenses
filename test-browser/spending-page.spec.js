import { test, expect } from "@playwright/test";

test("spending stays compact and its month picker is readable and navigates", async ({ page }) => {
  await page.goto("/spending?month=2026-07");
  await expect(page.getByRole("heading", { name: "Spending in July 2026", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Category activity", exact: true })).toHaveCount(0);
  const picker = page.getByRole("combobox", { name: "Spending month" });
  await expect(picker.locator("option:checked")).toHaveText("July 2026");
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
  await picker.selectOption("2026-06");
  await expect(page).toHaveURL(/month=2026-06/);
  await expect(page.getByRole("heading", { name: "Spending in June 2026", exact: true })).toBeVisible();
  await picker.selectOption("all");
  await expect(page.getByRole("heading", { name: "All spending", exact: true })).toBeVisible();
  await expect(picker.locator("option:checked")).toHaveText("All time");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
