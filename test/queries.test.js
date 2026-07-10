import test from "node:test";
import assert from "node:assert/strict";
import { getDashboardData } from "../lib/queries.js";
import { readFileSync } from "node:fs";

const globalsCss = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("dashboard query returns V1 sections", () => {
  const data = getDashboardData();
  assert.equal(data.db.readonly, true);
  assert.equal(data.db.exists, true);
  assert.ok(data.overview.expenseCount >= 0);
  assert.ok(Array.isArray(data.categories));
  assert.ok(Array.isArray(data.recentExpenses));
  assert.ok(Array.isArray(data.largestExpenses));
  assert.ok(Array.isArray(data.monthlyTotals));
  assert.ok(Array.isArray(data.dailyTotals));
  assert.ok(data.recentExpenses.length <= 10);
  assert.ok(data.largestExpenses.length <= 6);
  assert.ok(data.dailyTotals.every((day) => day.date.startsWith(data.month.activeMonth)));
  assert.deepEqual(data.dailyTotals.map((day) => day.date), data.dailyTotals.map((day) => day.date).toSorted());
  assert.equal(data.people, undefined);
});

test("transactions load more animation styles are present", () => {
  assert.match(globalsCss, /\.row-enter/);
  assert.match(globalsCss, /@keyframes rowEnter/);
});
