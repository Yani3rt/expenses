import test from "node:test";
import assert from "node:assert/strict";
import { getDashboardData } from "../lib/queries.js";
import { readFileSync } from "node:fs";
import { currentWeekBounds } from "../lib/date-range.js";

const globalsCss = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("dashboard query returns V1 sections", () => {
  const data = getDashboardData();
  assert.equal(data.db.readonly, true);
  assert.equal(data.db.exists, true);
  assert.ok(data.overview.expenseCount >= 0);
  assert.ok(Array.isArray(data.categories));
  assert.ok(Array.isArray(data.recentExpenses));
  assert.ok(Array.isArray(data.largestExpenses));
  assert.ok(Array.isArray(data.largestExpensesByRange.week));
  assert.ok(Array.isArray(data.largestExpensesByRange.month));
  assert.ok(Array.isArray(data.largestExpensesByRange.year));
  assert.ok(Array.isArray(data.monthlyTotals));
  assert.ok(Array.isArray(data.dailyTotals));
  assert.ok(data.recentExpenses.length <= 10);
  assert.ok(data.largestExpenses.length <= 6);
  assert.ok(data.largestExpensesByRange.week.length <= 6);
  assert.ok(data.largestExpensesByRange.month.length <= 6);
  assert.ok(data.largestExpensesByRange.year.length <= 6);
  const week = currentWeekBounds();
  assert.ok(data.largestExpensesByRange.week.every((expense) => expense.date >= week.start && expense.date <= week.end));
  assert.ok(data.largestExpensesByRange.month.every((expense) => expense.date.startsWith(data.month.activeMonth)));
  assert.ok(data.largestExpensesByRange.year.every((expense) => expense.date.startsWith(data.month.activeMonth.slice(0, 4))));
  assert.ok(data.dailyTotals.every((day) => day.date.startsWith(data.month.activeMonth)));
  assert.deepEqual(data.dailyTotals.map((day) => day.date), data.dailyTotals.map((day) => day.date).toSorted());
  assert.equal(data.people, undefined);
});

test("transactions load more animation styles are present", () => {
  assert.match(globalsCss, /\.row-enter/);
  assert.match(globalsCss, /@keyframes rowEnter/);
});
