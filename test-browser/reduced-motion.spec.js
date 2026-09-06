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

test("reduced motion keeps every dashboard chart fully painted", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator(".dither-chart-card");
  await expect(cards).toHaveCount(3);
  const geometry = [];
  for (const card of await cards.all()) {
    await card.scrollIntoViewIfNeeded();
    const crisp = card.locator("canvas").first();
    await expect.poll(async () => (await paintedGeometry(crisp)).columns).toBeGreaterThan(0);
    geometry.push(await paintedGeometry(crisp));
  }
  expect(geometry[0].columns / geometry[0].width).toBeGreaterThan(0.5);
  expect((geometry[0].maxX - geometry[0].minX) / geometry[0].width).toBeGreaterThan(0.8);
  expect((geometry[0].maxY - geometry[0].minY) / geometry[0].height).toBeGreaterThan(0.1);
  expect(geometry[0].colors).toBeGreaterThan(1);
  expect(geometry[1].clusters).toBeGreaterThanOrEqual(3);
  expect((geometry[1].maxX - geometry[1].minX) / geometry[1].width).toBeGreaterThan(0.5);
  expect((geometry[1].maxY - geometry[1].minY) / geometry[1].height).toBeGreaterThan(0.1);
  expect(geometry[2].columns / geometry[2].width).toBeGreaterThan(0.5);
  expect((geometry[2].maxX - geometry[2].minX) / geometry[2].width).toBeGreaterThan(0.8);
  await expect(cards.nth(0).getByRole("button", { name: "Current month" })).toBeVisible();
  await expect(cards.nth(0).getByRole("button", { name: "Previous month" })).toBeVisible();
  for (const month of ["05", "06", "07"]) {
    await expect(cards.nth(1).locator("svg")).toContainText(month);
  }

  await page.goto("/transactions");
  await page.getByRole("button", { name: /Tech accessory/ }).click();
  const detailCanvas = page.locator(".category-month-dither canvas").first();
  await expect.poll(async () => (await paintedGeometry(detailCanvas)).columns).toBeGreaterThan(0);
  const detailGeometry = await paintedGeometry(detailCanvas);
  expect(detailGeometry.maxX / detailGeometry.width).toBeGreaterThan(0.8);
  expect((detailGeometry.maxY - detailGeometry.minY) / detailGeometry.height).toBeGreaterThan(0.05);
});
