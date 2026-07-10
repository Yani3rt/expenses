import test from "node:test";
import assert from "node:assert/strict";
import { buildSpendingComparison } from "../lib/spending-comparison.js";

const category = (categorySlug, categoryName, totalSpend, expenseCount = 1) => ({
  category: categoryName,
  categorySlug,
  totalSpend,
  expenseCount,
  averageExpense: expenseCount ? totalSpend / expenseCount : 0,
  latestDate: "2026-07-01",
});

test("merges category periods and sorts by the largest absolute change", () => {
  const comparison = buildSpendingComparison({
    activeMonth: "2026-07",
    previousMonth: "2026-06",
    currentCategories: [
      category("subscriptions", "Subscriptions", 153),
      category("groceries", "Groceries", 80),
    ],
    previousCategories: [
      category("technology", "Technology", 280),
      category("subscriptions", "Subscriptions", 153),
      category("groceries", "Groceries", 20),
    ],
  });

  assert.equal(comparison.mode, "comparison");
  assert.equal(comparison.currentTotal, 233);
  assert.equal(comparison.previousTotal, 453);
  assert.equal(comparison.deltaAmount, -220);
  assert.equal(comparison.deltaPercent, -48.57);
  assert.deepEqual(comparison.rows.map((row) => row.categorySlug), ["technology", "groceries", "subscriptions"]);
  assert.deepEqual(comparison.rows.map((row) => row.direction), ["down", "up", "flat"]);
  assert.equal(comparison.rows[0].currentTotal, 0);
  assert.equal(comparison.rows[0].previousTotal, 280);
  assert.equal(comparison.rows[1].deltaPercent, 300);
});

test("marks current-only categories as new and omits zero-baseline percentages", () => {
  const comparison = buildSpendingComparison({
    activeMonth: "2026-07",
    previousMonth: "2026-06",
    currentCategories: [category("travel", "Travel", 125)],
    previousCategories: [],
  });

  assert.equal(comparison.previousTotal, 0);
  assert.equal(comparison.deltaPercent, null);
  assert.equal(comparison.rows[0].direction, "new");
  assert.equal(comparison.rows[0].deltaAmount, 125);
  assert.equal(comparison.rows[0].deltaPercent, null);
});

test("builds all-time rows with total share and no comparison delta", () => {
  const comparison = buildSpendingComparison({
    activeMonth: "all",
    previousMonth: null,
    currentCategories: [
      category("home", "Home", 300, 2),
      category("food", "Food", 100, 4),
    ],
    previousCategories: [],
  });

  assert.equal(comparison.mode, "historical");
  assert.equal(comparison.currentTotal, 400);
  assert.equal(comparison.previousTotal, null);
  assert.equal(comparison.deltaAmount, null);
  assert.deepEqual(comparison.rows.map((row) => row.sharePercent), [75, 25]);
  assert.equal(comparison.rows[0].expenseCount, 2);
});
