import { expect, test } from "@playwright/test";

test("year overview is independent of the rolling range and links to exact months", async ({ page }, testInfo) => {
  await page.goto("/?range=1w&end=2026-07-31&currency=USD");
  const overview = page.getByRole("region", { name: "Year overview" });
  if (testInfo.project.name === "mobile") {
    await expect(overview.locator(".year-overview-content")).toBeHidden();
    await overview.getByRole("button", { name: "Year overview" }).click();
  }
  await expect(overview.getByLabel("Overview year")).toHaveValue("2026");
  await expect(overview.locator(".year-total")).toContainText("$2,296.59");
  await expect(overview.locator(".year-month")).toHaveCount(12);
  await expect(overview.getByRole("link", { name: /Jul 2026:/ })).toContainText("$597.84");
  await page.getByRole("button", { name: "3M", exact: true }).click();
  await expect(page).toHaveURL(/range=3m/);
  await expect(overview.locator(".year-total")).toContainText("$2,296.59");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await overview.getByRole("link", { name: /Jul 2026:/ }).click();
  await expect(page).toHaveURL(/transactions\?month=2026-07&period=all/);
  await expect(page.getByLabel("Current ledger summary")).toContainText("$597.84");
});
