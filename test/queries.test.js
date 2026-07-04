import test from "node:test";
import assert from "node:assert/strict";
import { getDashboardData } from "../lib/queries.js";

test("dashboard query returns V1 sections", () => {
  const data = getDashboardData();
  assert.equal(data.db.readonly, true);
  assert.equal(data.db.exists, true);
  assert.ok(data.overview.expenseCount >= 0);
  assert.ok(Array.isArray(data.categories));
  assert.ok(Array.isArray(data.recentExpenses));
  assert.ok(Array.isArray(data.largestExpenses));
  assert.ok(Array.isArray(data.monthlyTotals));
  assert.ok(data.recentExpenses.length <= 6);
  assert.ok(data.largestExpenses.length <= 6);
  assert.equal(data.people, undefined);
});
