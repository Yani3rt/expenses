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

test("1M shows a full historical month and navigates calendar months", async ({ page }) => {
  await page.goto("/?range=1m&end=2026-07-15");
  await expect(page.locator(".date-label")).toHaveText("Jul 1 – Jul 31, 2026");
  await expect(page.getByTestId("workspace-total")).toHaveText("$597.84");
  await expect(page.locator(".total-lockup")).toContainText("$58.41 less than prior month");
  await expect(page.locator(".summary-strip")).toContainText("$19.29");
  await expect(page.getByTestId("workspace-transaction")).toHaveCount(12);
  await expect(page.getByTestId("workspace-transaction").last()).toContainText("Flight change");
  await page.getByRole("button", { name: "Previous period", exact: true }).click();
  await expect(page.locator(".date-label")).toHaveText("Jun 1 – Jun 30, 2026");
  await expect(page.getByTestId("workspace-total")).toHaveText("$656.25");
  await page.getByRole("button", { name: "Next period", exact: true }).click();
  await expect(page.locator(".date-label")).toHaveText("Jul 1 – Jul 31, 2026");
  await expect(page.getByTestId("workspace-total")).toHaveText("$597.84");
});

test("3M includes calendar boundaries and navigates three-month blocks", async ({ page }) => {
  await page.goto("/?range=3m&end=2026-07-15");
  await expect(page.locator(".date-label")).toHaveText("May 1 – Jul 31, 2026");
  await expect(page.getByTestId("workspace-total")).toHaveText("$2,296.59");
  await expect(page.locator(".summary-strip")).toContainText("$24.96");
  await expect(page.locator(".total-lockup")).toContainText("No spend in the prior 3 months");
  await page.getByRole("button", { name: "Previous period", exact: true }).click();
  await expect(page.locator(".date-label")).toHaveText("Feb 1 – Apr 30, 2026");
  await page.getByRole("button", { name: "Next period", exact: true }).click();
  await expect(page.locator(".date-label")).toHaveText("May 1 – Jul 31, 2026");
  await expect(page.getByTestId("workspace-total")).toHaveText("$2,296.59");
});
