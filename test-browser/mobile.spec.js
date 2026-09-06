import { expect, test } from "@playwright/test";

test("narrow layouts contain content and filter sheet is keyboard operable", async ({ page }) => {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  for (const path of ["/", "/spending", "/transactions"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }

  const filterButton = page.getByRole("button", { name: /Filters/ });
  await filterButton.focus();
  await page.keyboard.press("Enter");
  const sheet = page.getByRole("dialog", { name: "Filters" });
  await expect(sheet).toBeVisible();
  const closeButton = sheet.getByRole("button", { name: "Close filters" });
  const resultButton = sheet.getByRole("button", { name: /View \d+ results/ });
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(resultButton).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(sheet.getByRole("button", { name: "All time", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(sheet).not.toBeVisible();
  await expect(filterButton).toBeFocused();

  await filterButton.click();
  const technology = sheet.getByRole("checkbox", { name: "Technology" });
  await technology.focus();
  await page.keyboard.press("Space");
  await expect(page).toHaveURL(/category=tecnologia/);
  await sheet.getByRole("button", { name: /View 1 results/ }).focus();
  await page.keyboard.press("Enter");
  await expect(filterButton).toBeFocused();
  expect(consoleErrors.filter((message) => message.includes("hydrated"))).toEqual([]);
});
