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

test("transaction detail derives category-month data from the selected transaction", () => {
  const data = getTransactionDetailData({ id: 4, q: "ignored", month: "2026-07", category: "comida" });

  assert.equal(data.transaction.description, "Technology expense");
  assert.deepEqual(data.categoryMonth, {
    month: "2026-06",
    previousMonth: "2026-05",
    category: "Technology",
    categorySlug: "tecnologia",
    totalSpend: 280,
    expenseCount: 2,
    averageExpense: 140,
    previousTotalSpend: 0,
    deltaAmount: 280,
    deltaPercent: null,
    isNewThisMonth: true,
    selectedDate: "2026-06-13",
    dailyTotals: [
      { date: "2026-06-13", totalSpend: 210, expenseCount: 1 },
      { date: "2026-06-26", totalSpend: 70, expenseCount: 1 },
    ],
    expenses: [
      { id: 11, date: "2026-06-26", description: "Tech expense", amount: 70, currency: "USD", category: "Technology", categorySlug: "tecnologia", paidBy: "Yani", notes: null },
      { id: 4, date: "2026-06-13", description: "Technology expense", amount: 210, currency: "USD", category: "Technology", categorySlug: "tecnologia", paidBy: "Yani", notes: null },
    ],
  });
});

test("transaction detail compares the selected category with its previous month", () => {
  const data = getTransactionDetailData({ id: 24 });

  assert.equal(data.categoryMonth.month, "2026-07");
  assert.equal(data.categoryMonth.previousMonth, "2026-06");
  assert.equal(data.categoryMonth.totalSpend, 12.99);
  assert.equal(data.categoryMonth.previousTotalSpend, 280);
  assert.equal(data.categoryMonth.deltaAmount, -267.01);
  assert.equal(data.categoryMonth.deltaPercent, -95.36);
  assert.equal(data.categoryMonth.isNewThisMonth, false);
});

test("transaction detail returns null for a missing transaction", () => {
  assert.equal(getTransactionDetailData({ id: 999999 }), null);
});
