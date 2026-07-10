import test from "node:test";
import assert from "node:assert/strict";
import { buildCategoryShare } from "../lib/category-share.js";

const category = (categorySlug, totalSpend, expenseCount = 1) => ({
  category: categorySlug[0].toUpperCase() + categorySlug.slice(1),
  categorySlug,
  totalSpend,
  expenseCount,
});

test("keeps the top six categories and aggregates the remainder into Other", () => {
  const input = [
    category("health", 40, 2),
    category("travel", 210),
    category("transport", 30),
    category("subscriptions", 150),
    category("education", 90),
    category("groceries", 80),
    category("dining", 60),
    category("home", 50, 3),
  ];

  const result = buildCategoryShare(input);

  assert.equal(result.totalSpend, 710);
  assert.deepEqual(result.rows.map((row) => row.categorySlug), [
    "travel",
    "subscriptions",
    "education",
    "groceries",
    "dining",
    "home",
    "other",
  ]);
  assert.equal(result.rows[6].category, "Other");
  assert.equal(result.rows[6].totalSpend, 70);
  assert.equal(result.rows[6].expenseCount, 3);
  assert.equal(result.rows[6].isOther, true);
  assert.equal(result.rows[0].sharePercent, 29.58);
  assert.equal(result.rows[6].sharePercent, 9.86);
  assert.deepEqual(input.map((row) => row.categorySlug), ["health", "travel", "transport", "subscriptions", "education", "groceries", "dining", "home"]);
});

test("does not invent Other when six or fewer categories exist", () => {
  const result = buildCategoryShare([
    category("one", 60),
    category("two", 40),
  ]);

  assert.equal(result.totalSpend, 100);
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows.some((row) => row.isOther), false);
  assert.deepEqual(result.rows.map((row) => row.sharePercent), [60, 40]);
});

test("returns a safe empty share model", () => {
  assert.deepEqual(buildCategoryShare([]), { totalSpend: 0, rows: [] });
  assert.deepEqual(buildCategoryShare(null), { totalSpend: 0, rows: [] });
});
