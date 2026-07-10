import test from "node:test";
import assert from "node:assert/strict";
import { buildDashboardComparison } from "../lib/dashboard-comparison.js";

test("builds an increasing monthly comparison with signed drivers", () => {
  const comparison = buildDashboardComparison({
    currentMonth: "2026-06",
    previousMonth: "2026-05",
    currentTotal: 4200,
    previousTotal: 3780,
    categoryRows: [
      { category: "Food", categorySlug: "comida", currentTotal: 900, previousTotal: 610 },
      { category: "Transport", categorySlug: "transporte", currentTotal: 120, previousTotal: 200 },
    ],
  });

  assert.equal(comparison.direction, "up");
  assert.equal(comparison.deltaAmount, 420);
  assert.equal(comparison.deltaPercent, 11.11);
  assert.deepEqual(comparison.primaryDriver, {
    category: "Food",
    categorySlug: "comida",
    deltaAmount: 290,
  });
  assert.deepEqual(comparison.offsetDriver, {
    category: "Transport",
    categorySlug: "transporte",
    deltaAmount: -80,
  });
});

test("builds decreasing and flat comparisons", () => {
  const decreasing = buildDashboardComparison({
    currentMonth: "2026-06",
    previousMonth: "2026-05",
    currentTotal: 800,
    previousTotal: 1000,
    categoryRows: [],
  });
  const flat = buildDashboardComparison({
    currentMonth: "2026-06",
    previousMonth: "2026-05",
    currentTotal: 1000,
    previousTotal: 1000,
    categoryRows: [],
  });

  assert.equal(decreasing.direction, "down");
  assert.equal(decreasing.deltaAmount, -200);
  assert.equal(decreasing.deltaPercent, -20);
  assert.equal(flat.direction, "flat");
  assert.equal(flat.deltaAmount, 0);
  assert.equal(flat.deltaPercent, 0);
});

test("returns a null percentage when the previous month has no spending", () => {
  const comparison = buildDashboardComparison({
    currentMonth: "2026-06",
    previousMonth: "2026-05",
    currentTotal: 500,
    previousTotal: 0,
    categoryRows: [
      { category: "Groceries", categorySlug: "supermercado", currentTotal: 500, previousTotal: null },
    ],
  });

  assert.equal(comparison.deltaPercent, null);
  assert.equal(comparison.direction, "up");
  assert.equal(comparison.primaryDriver.deltaAmount, 500);
  assert.equal(comparison.offsetDriver, null);
});

test("handles missing current-month data without inventing a comparison", () => {
  const comparison = buildDashboardComparison({
    currentMonth: null,
    previousMonth: null,
    currentTotal: 0,
    previousTotal: 0,
    categoryRows: [],
  });

  assert.equal(comparison.direction, "none");
  assert.equal(comparison.deltaPercent, null);
  assert.equal(comparison.primaryDriver, null);
  assert.equal(comparison.offsetDriver, null);
});
