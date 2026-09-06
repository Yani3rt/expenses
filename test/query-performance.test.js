import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createExpenseFixture, useExpenseFixture } from "../test-support/expense-fixture.js";
import {
  getDashboardData,
  getSpendingData,
  getTransactionDetailData,
  getTransactionsData,
  getTransactionsPageData,
} from "../lib/queries.js";

useExpenseFixture();

function normalizeSql(sql) {
  return String(sql).replace(/\s+/g, " ").trim();
}

function traceLoader(t, loader) {
  const statements = [];
  let connections = 0;
  const originalPrepare = DatabaseSync.prototype.prepare;
  const originalClose = DatabaseSync.prototype.close;

  t.mock.method(DatabaseSync.prototype, "prepare", function tracedPrepare(sql) {
    const statement = originalPrepare.call(this, sql);
    if (/^\s*(?:WITH\b[\s\S]*?\bSELECT\b|SELECT\b)/i.test(sql)) {
      const trace = { sql: normalizeSql(sql), params: undefined };
      statements.push(trace);
      for (const method of ["all", "get"]) {
        const original = statement[method];
        t.mock.method(statement, method, function tracedExecution(params) {
          trace.params = params;
          return arguments.length ? original.call(this, params) : original.call(this);
        });
      }
    }
    return statement;
  });
  t.mock.method(DatabaseSync.prototype, "close", function tracedClose() {
    connections += 1;
    return originalClose.call(this);
  });

  const data = loader();
  return { data, statements, connections };
}

test("dashboard composes focused queries on one connection", (t) => {
  const result = traceLoader(t, () => getDashboardData());

  assert.equal(result.connections, 1);
  assert.ok(result.statements.length < 16, `expected fewer than 16 SELECTs, got ${result.statements.length}`);
  assert.equal(result.data.month.totalSpend, 597.84);
  assert.equal(result.data.largestExpense.id, 19);
  assert.deepEqual(result.data.recentExpenses.map(({ id }) => id), [24, 23, 22, 21, 20, 19, 18, 17, 16, 15]);
});

test("pagination omits month catalogs and facet aggregates", (t) => {
  const result = traceLoader(t, () => getTransactionsPageData({
    month: "2026-07",
    categories: ["viajes"],
    sort: "highest",
    limit: 2,
    offset: 2,
  }));

  assert.equal(result.connections, 1);
  assert.equal(result.statements.length, 3);
  assert.deepEqual(result.data.transactions.map(({ id }) => id), [17, 15]);
  assert.equal(result.data.summary.totalSpend, 349.5);
  assert.equal(result.data.meta.totalRows, 6);
  assert.equal(result.data.meta.hasMore, true);
  assert.equal(result.statements.some(({ sql }) => /GROUP BY\s+(?:value|substr\(expense_date)/i.test(sql)), false);
  assert.equal(result.statements.some(({ sql }) => /LEFT JOIN expenses/i.test(sql)), false);
});

test("all-time pagination preserves baseline results with two selects and one connection", (t) => {
  const result = traceLoader(t, () => getTransactionsPageData({ offset: 10, limit: 10 }));
  assert.equal(result.connections, 1);
  assert.equal(result.statements.length, 2);
  assert.equal(result.data.summary.totalSpend, 2296.59);
  assert.deepEqual(result.data.transactions.map(({ id }) => id), [14, 13, 12, 11, 10, 9, 8, 4, 7, 6]);
});

test("spending preserves baseline results with six selects and one connection", (t) => {
  const result = traceLoader(t, () => getSpendingData({ month: "2026-06" }));
  assert.equal(result.connections, 1);
  assert.equal(result.statements.length, 6);
  assert.equal(result.data.summary.totalSpend, 656.25);
  assert.equal(result.data.previousSummary.totalSpend, 1042.5);
  assert.equal(result.data.topCategory.categorySlug, "tecnologia");
});

test("a loader-emitted date predicate uses a range search with its actual bindings", (t) => {
  const traced = traceLoader(t, () => getSpendingData({ month: "2026-06" }));
  const rangeQuery = traced.statements.find(({ sql, params }) =>
    /FROM expenses e WHERE e\.expense_date >= :currentFrom AND e\.expense_date < :currentTo/.test(sql)
      && params?.currentFrom === "2026-06-01"
      && params?.currentTo === "2026-07-01");
  assert.ok(rangeQuery);
  const fixture = createExpenseFixture();
  const db = new DatabaseSync(fixture.path, { readOnly: true });
  try {
    const plan = db.prepare(`EXPLAIN QUERY PLAN ${rangeQuery.sql}`).all(rangeQuery.params);
    assert.match(plan.map((row) => row.detail).join("\n"), /SEARCH (?:expenses|e) USING .*expense_date.*\(expense_date>\? AND expense_date<\?\)/i);
  } finally {
    db.close();
    fixture.cleanup();
  }
});

test("focused pagination normalizes unknown categories like initial page data", () => {
  for (const categories of [["tecnologia", "not-a-category"], ["not-a-category"]]) {
    const options = { categories, limit: 10, offset: 0 };
    const initial = getTransactionsData(options);
    const focused = getTransactionsPageData(options);
    assert.deepEqual(focused.transactions, initial.transactions);
    assert.deepEqual(focused.summary, initial.summary);
    assert.deepEqual(focused.meta, initial.meta);
  }
});

test("month boundaries include their first and last dates without leaking adjacent months", () => {
  assert.deepEqual(
    getSpendingData({ month: "2026-06" }).categories.map(({ categorySlug, expenseCount }) => [categorySlug, expenseCount]),
    [["tecnologia", 2], ["viajes", 4], ["comida", 3]],
  );
  const detail = getTransactionDetailData({ id: 5 });
  assert.equal(detail.categoryMonth.month, "2026-06");
  assert.deepEqual(detail.categoryMonth.expenses.map(({ id }) => id), [12, 10, 7, 5]);
});

test("focused loaders keep stable empty-data shapes", () => {
  const fixture = createExpenseFixture();
  const writable = new DatabaseSync(fixture.path);
  writable.exec("DELETE FROM expense_allocations; DELETE FROM expenses;");
  writable.close();
  const prior = process.env.EXPENSE_DB_PATH;
  process.env.EXPENSE_DB_PATH = fixture.path;
  try {
    const dashboard = getDashboardData();
    const page = getTransactionsPageData({ limit: 10 });
    assert.deepEqual(dashboard.month, { activeMonth: null, expenseCount: 0, totalSpend: 0, averageExpense: 0 });
    assert.deepEqual(dashboard.categories, []);
    assert.deepEqual(dashboard.recentExpenses, []);
    assert.deepEqual(page.transactions, []);
    assert.equal(page.summary.expenseCount, 0);
    assert.equal(page.meta.hasMore, false);
  } finally {
    process.env.EXPENSE_DB_PATH = prior;
    fixture.cleanup();
  }
});

test("amount sorting has stable date and id tie breakers across pages", () => {
  const fixture = createExpenseFixture();
  const writable = new DatabaseSync(fixture.path);
  const insert = writable.prepare(`
    INSERT INTO expenses
      (id, expense_date, description, amount, currency, category_id, paid_by_person_id, notes)
    VALUES (?, '2026-07-17', ?, 140, 'USD', 2, 1, NULL)
  `);
  insert.run(25, "Tie A");
  insert.run(26, "Tie B");
  writable.close();
  const prior = process.env.EXPENSE_DB_PATH;
  process.env.EXPENSE_DB_PATH = fixture.path;
  try {
    const first = getTransactionsPageData({ month: "2026-07", sort: "highest", limit: 2 });
    const second = getTransactionsPageData({ month: "2026-07", sort: "highest", limit: 2, offset: 2 });
    assert.deepEqual([...first.transactions, ...second.transactions].map(({ id }) => id), [26, 25, 19, 13]);
  } finally {
    process.env.EXPENSE_DB_PATH = prior;
    fixture.cleanup();
  }
});

test("range filters handle leap day and December to January boundaries", () => {
  const fixture = createExpenseFixture();
  const writable = new DatabaseSync(fixture.path);
  const insert = writable.prepare(`
    INSERT INTO expenses
      (id, expense_date, description, amount, currency, category_id, paid_by_person_id, notes)
    VALUES (?, ?, ?, 1, 'USD', 3, 1, NULL)
  `);
  insert.run(25, "2024-02-28", "Leap eve");
  insert.run(26, "2024-02-29", "Leap day");
  insert.run(27, "2024-03-01", "March");
  insert.run(28, "2026-12-31", "Year end");
  insert.run(29, "2027-01-01", "New year");
  writable.close();
  const prior = process.env.EXPENSE_DB_PATH;
  process.env.EXPENSE_DB_PATH = fixture.path;
  try {
    assert.deepEqual(getTransactionsPageData({ month: "2024-02", limit: 10 }).transactions.map(({ id }) => id), [26, 25]);
    assert.deepEqual(getTransactionsPageData({ month: "2026-12", limit: 10 }).transactions.map(({ id }) => id), [28]);
    assert.deepEqual(getTransactionsPageData({ month: "2027-01", limit: 10 }).transactions.map(({ id }) => id), [29]);
  } finally {
    process.env.EXPENSE_DB_PATH = prior;
    fixture.cleanup();
  }
});

test("transaction detail returns every row when a category-month exceeds the pagination cap", () => {
  const fixture = createExpenseFixture();
  const writable = new DatabaseSync(fixture.path);
  const insert = writable.prepare(`
    INSERT INTO expenses
      (id, expense_date, description, amount, currency, category_id, paid_by_person_id, notes)
    VALUES (?, '2028-02-29', ?, 1, 'USD', 3, 1, NULL)
  `);
  for (let index = 0; index < 201; index += 1) insert.run(1000 + index, `Bulk ${index}`);
  writable.close();
  const prior = process.env.EXPENSE_DB_PATH;
  process.env.EXPENSE_DB_PATH = fixture.path;
  try {
    const detail = getTransactionDetailData({ id: 1000 });
    assert.equal(detail.categoryMonth.expenseCount, 201);
    assert.equal(detail.categoryMonth.expenses.length, 201);
    assert.deepEqual(detail.categoryMonth.expenses.slice(0, 3).map(({ id }) => id), [1200, 1199, 1198]);
  } finally {
    process.env.EXPENSE_DB_PATH = prior;
    fixture.cleanup();
  }
});
