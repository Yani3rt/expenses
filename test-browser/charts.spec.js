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

test('trend shows actual date gaps and supports keyboard inspection', async ({ page }) => {
  await page.goto('/?range=1m&end=2026-07-31');
  const chart = page.getByRole('img', { name: /Spending trend,/ });
  await expect(chart).toBeVisible();
  const geometry = await chart.locator('.trend-line').evaluate(node => ({ length: node.getTotalLength(), width: node.getBBox().width, height: node.getBBox().height }));
  expect(geometry.length).toBeGreaterThan(100);
  expect(geometry.width).toBeGreaterThan(500);
  expect(geometry.height).toBeGreaterThan(50);
  const startPoint = await chart.locator('.trend-line').evaluate(node => {
    const point = node.getPointAtLength(0);
    const view = node.ownerSVGElement.viewBox.baseVal;
    return { x: point.x / view.width, y: point.y / view.height };
  });
  const bounds = await chart.boundingBox();
  await chart.hover({ position: { x: bounds.width * startPoint.x, y: bounds.height * startPoint.y } });
  await expect(page.locator('.trend output')).toContainText('Jul 2 · $0.00');
  await chart.focus();
  await page.keyboard.press('Home');
  await expect(page.locator('.trend output')).toContainText('Jul 2 · $0.00');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.trend output')).toContainText('Jul 3 · $14.50');
  await page.keyboard.press('End');
  await expect(page.locator('.trend output')).toContainText('Jul 31 · $12.99');
  await page.getByRole('button', { name: '1W', exact: true }).click();
  await expect(page).toHaveURL(/range=1w/);
  await page.goBack();
  await expect(page).toHaveURL(/range=1m/);
  await chart.focus();
  await page.keyboard.press('End');
  await page.goForward();
  await expect(page.getByRole('img', { name: /Spending trend,/ })).toBeVisible();
  await expect(page.locator('.trend output')).toContainText('Jul 31');
});

test('detail canvas paints on demand and stops after close', async ({ page }) => {
  await page.goto('/?range=all');
  await page.getByTestId('workspace-transaction').filter({ hasText: 'Tech accessory' }).click();
  const canvas = page.locator('.category-month-dither canvas').first();
  await expect.poll(() => canvasCount(canvas)).toBeGreaterThan(0);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const hasSageBars = await canvas.evaluate(node => {
    const pixels = node.getContext("2d").getImageData(0, 0, node.width, node.height).data;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] > 120 && Math.abs(pixels[i] - 172) < 3 && Math.abs(pixels[i + 1] - 191) < 3 && Math.abs(pixels[i + 2] - 145) < 3) return true;
    }
    return false;
  });
  expect(hasSageBars).toBe(true);
  await expect(page.locator(".category-month-dither canvas").nth(1)).toHaveCSS("opacity", "0");
  const count = await canvasCount(canvas);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await canvasCount(canvas)).toBe(count);
  await page.getByRole('button', { name: 'Close transaction details' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const after = await page.evaluate(() => [...window.__expenseCanvasOps.values()].reduce((a,b) => a+b,0));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await page.evaluate(() => [...window.__expenseCanvasOps.values()].reduce((a,b) => a+b,0))).toBe(after);
});
