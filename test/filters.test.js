import test from "node:test";
import assert from "node:assert/strict";
import { getAvailableMonths, getSpendingData, getTransactionsData } from "../lib/queries.js";

test("available months expose ALL plus concrete expense months", () => {
  const months = getAvailableMonths();
  assert.equal(months[0].value, "all");
  assert.ok(months.some((month) => month.value === "2026-06"));
  assert.ok(months.some((month) => month.value === "2026-05"));
});

test("spending data can switch between all-time and a specific month", () => {
  const all = getSpendingData({ month: "all" });
  const june = getSpendingData({ month: "2026-06" });
  assert.equal(all.activeMonth, "all");
  assert.equal(june.activeMonth, "2026-06");
  assert.ok(all.summary.totalSpend > june.summary.totalSpend);
  assert.ok(all.categories.length >= june.categories.length);
});

test("transactions support text and category filters", () => {
  const tech = getTransactionsData({ q: "tech", category: "tecnologia" });
  assert.ok(tech.transactions.length > 0);
  assert.ok(tech.transactions.every((expense) => expense.categorySlug === "tecnologia"));
  assert.ok(tech.transactions.every((expense) => expense.description.toLowerCase().includes("tech")));
});

test("transactions include every selected category with OR filtering", () => {
  const data = getTransactionsData({ categories: ["tecnologia", "viajes"] });

  assert.ok(data.transactions.length > 0);
  assert.ok(data.transactions.every((expense) => ["tecnologia", "viajes"].includes(expense.categorySlug)));
  assert.ok(data.transactions.some((expense) => expense.categorySlug === "tecnologia"));
  assert.ok(data.transactions.some((expense) => expense.categorySlug === "viajes"));
  assert.deepEqual(data.meta.categories, ["tecnologia", "viajes"]);
});

test("transactions ignore unknown categories when valid selections remain", () => {
  const data = getTransactionsData({ categories: ["tecnologia", "not-a-category"] });

  assert.ok(data.transactions.length > 0);
  assert.ok(data.transactions.every((expense) => expense.categorySlug === "tecnologia"));
  assert.deepEqual(data.meta.categories, ["tecnologia"]);
});

test("category options expose availability for the active date filters", () => {
  const data = getTransactionsData({ period: "this_month" });
  const counts = Object.fromEntries(data.categories.map((category) => [category.slug, category.expenseCount]));

  assert.equal(counts.clothes, 0);
  assert.equal(counts.alquiler, 0);
  assert.ok(counts.viajes > 0);
  assert.ok(counts.tecnologia > 0);
});

test("category availability follows search filters but ignores category selections", () => {
  const searched = getTransactionsData({ q: "tech" });
  const selected = getTransactionsData({ period: "this_month", categories: ["alquiler"] });
  const searchedCounts = Object.fromEntries(searched.categories.map((category) => [category.slug, category.expenseCount]));
  const selectedCounts = Object.fromEntries(selected.categories.map((category) => [category.slug, category.expenseCount]));

  assert.ok(searchedCounts.tecnologia > 0);
  assert.equal(searchedCounts.viajes, 0);
  assert.equal(selectedCounts.alquiler, 0);
  assert.ok(selectedCounts.viajes > 0);
});

test("transactions month selector filters without a separate range mode", () => {
  const may = getTransactionsData({ month: "2026-05" });
  assert.ok(may.transactions.length > 0);
  assert.ok(may.transactions.every((expense) => expense.date.startsWith("2026-05")));
});

test("transactions no longer support the last-30-days period", () => {
  const last30 = getTransactionsData({ period: "last30" });
  assert.equal(last30.meta.period, "all");
  assert.deepEqual(last30.meta.dateRange, { from: null, to: null });
});

test("transactions support quick date presets", () => {
  const lastMonth = getTransactionsData({ period: "last_month" });
  assert.equal(lastMonth.meta.period, "last_month");
  assert.ok(lastMonth.transactions.length > 0);
  assert.ok(lastMonth.transactions.every((expense) => expense.date.startsWith("2026-06")));
});

test("transactions support amount sorting", () => {
  const highest = getTransactionsData({ sort: "highest" });
  const lowest = getTransactionsData({ sort: "lowest" });
  assert.ok(highest.transactions[0].amount >= highest.transactions.at(-1).amount);
  assert.ok(lowest.transactions[0].amount <= lowest.transactions.at(-1).amount);
});

test("transactions cap initial rows and expose pagination metadata", () => {
  const data = getTransactionsData({ offset: 0 });
  assert.equal(data.transactions.length <= 10, true);
  assert.equal(data.meta.limit, 10);
  assert.equal(data.meta.offset, 0);
  assert.equal(typeof data.meta.hasMore, "boolean");
  assert.ok(data.meta.totalRows >= data.transactions.length);
});

test("transactions can load more rows with offset pagination", () => {
  const firstPage = getTransactionsData({ limit: 2, offset: 0, sort: "newest" });
  const secondPage = getTransactionsData({ limit: 2, offset: 2, sort: "newest" });
  assert.equal(secondPage.meta.offset, 2);
  assert.equal(secondPage.transactions.length <= 2, true);
  assert.notDeepEqual(
    firstPage.transactions.map((expense) => expense.id),
    secondPage.transactions.map((expense) => expense.id),
  );
});
