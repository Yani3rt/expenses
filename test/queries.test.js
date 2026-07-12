import test from "node:test";
import assert from "node:assert/strict";
import { getDashboardData, getTransactionDetailData } from "../lib/queries.js";
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

test("transaction detail insights use the complete filtered search population", () => {
  const data = getTransactionDetailData({ id: 4, q: "tech" });

  assert.equal(data.transaction.description, "Technology expense");
  assert.deepEqual(data.context, {
    rank: 1,
    resultCount: 2,
    spendSharePercent: 75,
    differenceFromAverage: 70,
    filteredAverage: 140,
    categoryAverage: 140,
    categoryRank: 1,
    categorySharePercent: 75,
  });
});

test("transaction detail insights honor month and category constraints", () => {
  const data = getTransactionDetailData({
    id: 11,
    month: "2026-06",
    category: "tecnologia",
  });

  assert.deepEqual(data.context, {
    rank: 2,
    resultCount: 2,
    spendSharePercent: 25,
    differenceFromAverage: -70,
    filteredAverage: 140,
    categoryAverage: 140,
    categoryRank: 2,
    categorySharePercent: 25,
  });
});

test("transaction detail insights honor period constraints and missing ids", () => {
  const data = getTransactionDetailData({ id: 4, period: "last_month" });

  assert.equal(data.context.resultCount, 12);
  assert.equal(data.context.rank, 1);
  assert.equal(data.context.filteredAverage, 97.37);
  assert.equal(data.context.differenceFromAverage, 112.63);
  assert.equal(getTransactionDetailData({ id: 999999, period: "last_month" }), null);
});

test("transaction detail keeps category metrics scoped when several categories are filtered", () => {
  const data = getTransactionDetailData({ id: 4, month: "2026-06" });

  assert.notEqual(data.context.filteredAverage, data.context.categoryAverage);
  assert.notEqual(data.context.spendSharePercent, data.context.categorySharePercent);
  assert.ok(data.context.rank > 0);
  assert.equal(data.context.categoryRank, 1);
});

test("transaction detail ranking breaks equal amount and date ties by descending id", () => {
  const higherId = getTransactionDetailData({ id: 3, month: "2026-06" });
  const lowerId = getTransactionDetailData({ id: 2, month: "2026-06" });

  assert.equal(higherId.transaction.amount, lowerId.transaction.amount);
  assert.equal(higherId.transaction.date, lowerId.transaction.date);
  assert.equal(higherId.context.rank + 1, lowerId.context.rank);
  assert.equal(higherId.context.categoryRank + 1, lowerId.context.categoryRank);
});
