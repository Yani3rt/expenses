import { expect, test } from "@playwright/test";

async function paintedGeometry(canvas) {
  return canvas.evaluate((node) => {
    const { width, height } = node;
    const pixels = node.getContext("2d").getImageData(0, 0, width, height).data;
    const columns = new Array(width).fill(false);
    const rows = new Array(height).fill(false);
    const colors = new Set();
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        if (pixels[offset + 3] === 0) continue;
        columns[x] = true;
        rows[y] = true;
        colors.add(`${pixels[offset]},${pixels[offset + 1]},${pixels[offset + 2]}`);
      }
    }
    const activeColumns = columns.flatMap((active, index) => active ? [index] : []);
    const activeRows = rows.flatMap((active, index) => active ? [index] : []);
    let clusters = 0;
    let previous = -10;
    for (const column of activeColumns) {
      if (column - previous > 5) clusters += 1;
      previous = column;
    }
    return {
      width,
      height,
      columns: activeColumns.length,
      minX: activeColumns[0] ?? -1,
      maxX: activeColumns.at(-1) ?? -1,
      minY: activeRows[0] ?? -1,
      maxY: activeRows.at(-1) ?? -1,
      clusters,
      colors: colors.size,
    };
  });
}

test("reduced motion keeps the workspace trend and transaction details fully visible", async ({ page }) => {
  await page.goto("/?range=1m&end=2026-07-31");
  await expect(page.getByTestId("workspace-total")).toHaveText("$597.84");
  const chart = page.getByRole("img", { name: /Spending trend,/ });
  await expect(chart).toBeVisible();
  const geometry = await chart.locator(".trend-line").evaluate(node => ({ length: node.getTotalLength(), width: node.getBBox().width, height: node.getBBox().height }));
  expect(geometry.width).toBeGreaterThan(500);
  expect(geometry.height).toBeGreaterThan(50);
  await chart.focus();
  await page.keyboard.press("End");
  await expect(page.locator(".trend output")).toContainText("$12.99");
  await page.getByTestId("workspace-transaction").filter({ hasText: "Tech accessory" }).click();
  const detailCanvas = page.locator(".category-month-dither canvas").first();
  await expect.poll(async () => (await paintedGeometry(detailCanvas)).columns).toBeGreaterThan(0);
  const detailGeometry = await paintedGeometry(detailCanvas);
  expect(detailGeometry.maxX / detailGeometry.width).toBeGreaterThan(0.8);
  expect((detailGeometry.maxY - detailGeometry.minY) / detailGeometry.height).toBeGreaterThan(0.05);
});
