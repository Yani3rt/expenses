import { chooseOption } from './select-helpers.js';
import { expect, test } from "@playwright/test";

test("custom calendar preserves filters and restores focus", async ({ page }) => {
  await page.goto("/?range=3m&end=2026-07-31&currency=USD&category=tecnologia");
  const trigger = page.getByRole("button", { name: "Period end date", exact: true });
  await expect(page.locator('input[type="date"]')).toHaveCount(0);
  const bounds = await trigger.boundingBox();
  expect(bounds.height).toBe(44);
  await trigger.click();
  const calendar = page.getByRole("dialog", { name: "Period end date" });
  await expect(calendar).toBeVisible();
  await expect(calendar.getByRole("button", { name: "July 31, 2026", exact: true })).toBeFocused();
  await chooseOption(page, calendar.getByRole("combobox", { name: "Calendar month", exact: true }), "5");
  await calendar.getByRole("button", { name: "June 30, 2026", exact: true }).click();
  await expect(page).toHaveURL(/end=2026-06-30/);
  await expect(page).toHaveURL(/category=tecnologia/);
  await expect(page).toHaveURL(/range=3m/);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await calendar.getByRole("button", { name: "Previous calendar month" }).click();
  await expect(calendar.getByRole("combobox", { name: "Calendar month", exact: true })).toHaveAttribute("data-value", "4");
  await page.keyboard.press("Escape");
  await expect(calendar).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText("Jun 30, 2026");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
