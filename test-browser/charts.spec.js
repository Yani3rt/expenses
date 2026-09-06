import { expect, test } from "@playwright/test";

async function canvasCount(canvas) {
  return canvas.evaluate((node) => window.__expenseCanvasOps.get(node) ?? 0);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__expenseCanvasOps = new Map();
    const methods = ["clearRect", "fillRect", "drawImage"];
    for (const method of methods) {
      const original = CanvasRenderingContext2D.prototype[method];
      CanvasRenderingContext2D.prototype[method] = function (...args) {
        const canvas = this.canvas;
        window.__expenseCanvasOps.set(canvas, (window.__expenseCanvasOps.get(canvas) ?? 0) + 1);
        return original.apply(this, args);
      };
    }
  });
});

test("charts paint final data, settle idle, and react only to owned interactions", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator(".dither-chart-card");
  await expect(cards).toHaveCount(3);
  const cumulative = cards.filter({ hasText: "Cumulative daily spend" });
  const cumulativeCanvas = cumulative.locator("canvas").first();
  await cumulative.scrollIntoViewIfNeeded();
  await expect.poll(() => canvasCount(cumulativeCanvas)).toBeGreaterThan(0);

  const settled = await canvasCount(cumulativeCanvas);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await canvasCount(cumulativeCanvas)).toBe(settled);

  const chartRoot = cumulative.locator(".dither-chart-stage > div");
  const beforeHover = await canvasCount(cumulativeCanvas);
  await chartRoot.hover({ position: { x: 120, y: 140 } });
  await expect(cumulative.locator(".dither-tooltip-compact")).toBeVisible();
  await expect.poll(() => canvasCount(cumulativeCanvas)).toBeGreaterThan(beforeHover);
  const afterCategoryHover = await canvasCount(cumulativeCanvas);
  const box = await chartRoot.boundingBox();
  await page.mouse.move(box.x + 121, box.y + 140);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await canvasCount(cumulativeCanvas)).toBe(afterCategoryHover);

  const beforeLegend = await canvasCount(cumulativeCanvas);
  await cumulative.getByRole("button", { name: "Current month" }).click();
  await expect.poll(() => canvasCount(cumulativeCanvas)).toBeGreaterThan(beforeLegend);

  await chartRoot.dispatchEvent("pointerdown", { pointerType: "touch", clientX: 220, clientY: 150 });
  await chartRoot.dispatchEvent("pointerleave", { pointerType: "touch" });
  await expect(cumulative.locator(".dither-tooltip-compact")).toBeVisible();
});

test("offscreen Daily updates wait for that canvas to reenter", async ({ page }) => {
  await page.goto("/");
  const daily = page.locator(".dither-chart-card").nth(2);
  const dailyCanvas = daily.locator("canvas").first();
  await daily.scrollIntoViewIfNeeded();
  await expect.poll(() => canvasCount(dailyCanvas)).toBeGreaterThan(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(async () => daily.evaluate((node) => node.getBoundingClientRect().top > innerHeight)).toBe(true);
  const before = await canvasCount(dailyCanvas);
  await daily.getByRole("tab", { name: "Week" }).evaluate((button) => button.click());
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await canvasCount(dailyCanvas)).toBe(before);
  await daily.scrollIntoViewIfNeeded();
  await expect.poll(() => canvasCount(dailyCanvas)).toBeGreaterThan(before);
});

test("pinned tooltips reset across empty range changes and detail charts stop on close", async ({ page }) => {
  await page.goto("/");
  const daily = page.locator(".dither-chart-card").nth(2);
  await daily.scrollIntoViewIfNeeded();
  const dailyRoot = daily.locator(".dither-chart-stage > div");
  await dailyRoot.dispatchEvent("pointerdown", { pointerType: "touch", clientX: 300, clientY: 180 });
  await expect(daily.locator(".dither-tooltip-compact, .dither-chart-stage > div > div:not(:has(> button))")).toBeVisible();
  await daily.getByRole("tab", { name: "Week" }).click();
  await expect(daily.locator(".dither-chart-stage > div > div:not(:has(> button))")).toHaveCount(0);
  await daily.getByRole("tab", { name: "Month" }).click();
  await expect(daily.locator(".dither-chart-stage > div > div:not(:has(> button))")).toHaveCount(0);

  await page.goto("/transactions");
  await page.getByRole("button", { name: /Tech accessory/ }).click();
  const dialog = page.getByRole("dialog", { name: /Technology in July 2026/ });
  const detailCanvas = dialog.locator("canvas").first();
  await expect.poll(() => canvasCount(detailCanvas)).toBeGreaterThan(0);
  const settled = await canvasCount(detailCanvas);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await canvasCount(detailCanvas)).toBe(settled);
  await dialog.getByRole("button", { name: "Close transaction details" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".category-month-dither canvas")).toHaveCount(0);
});
