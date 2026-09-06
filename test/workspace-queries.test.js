import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createExpenseFixture, useExpenseFixture } from "../test-support/expense-fixture.js";
import { getWorkspaceData } from "../lib/workspace-queries.js";
import { GET } from "../app/api/workspace/route.js";

useExpenseFixture();

function useTemporaryFixture(mutator, callback) {
  const fixture = createExpenseFixture();
  const writable = new DatabaseSync(fixture.path);
  try {
    mutator(writable);
  } finally {
    writable.close();
  }
  const previous = process.env.EXPENSE_DB_PATH;
  process.env.EXPENSE_DB_PATH = fixture.path;
  try {
    return callback();
  } finally {
    process.env.EXPENSE_DB_PATH = previous;
    fixture.cleanup();
  }
}

test("returns the bounded workspace contract with July overview and ledger data", () => {
  const data = getWorkspaceData({ range: "1m", end: "2026-07-31" }, new Date("2026-07-31T12:00:00Z"));

  assert.deepEqual(data.range, {
    range: "1m", end: "2026-07-31", from: "2026-07-02", to: "2026-08-01",
    previousFrom: "2026-06-02", previousTo: "2026-07-02", days: 30,
    label: "Jul 2 – Jul 31, 2026",
  });
  assert.equal(data.currency, "USD");
  assert.deepEqual(data.currencies, ["USD"]);
  assert.deepEqual(data.summary, {
    totalSpend: 502.84,
    expenseCount: 11,
    averageExpense: 45.71,
    previousSpend: 706.25,
    deltaAmount: -203.41,
    deltaPercent: -28.8,
  });
  assert.deepEqual(data.categories.find(({ slug }) => slug === "tecnologia"), {
    slug: "tecnologia", name: "Technology", totalSpend: 12.99, expenseCount: 1,
  });
  assert.deepEqual(data.transactions.at(-1), {
    id: 14, date: "2026-07-03", description: "Breakfast", amount: 14.5, currency: "USD",
    category: "Food", categorySlug: "comida", paidBy: "Alex", notes: null,
  });
  assert.deepEqual(data.meta, {
    q: "", category: "all", sort: "newest", offset: 0, limit: 20,
    hasMore: false, totalMatches: 11,
  });
  assert.equal(data.latestDate, "2026-07-31");
  assert.equal(data.status.readonly, true);
});

test("keeps overview aggregates stable while binding ledger filters and paginating in SQL", (t) => {
  const statements = [];
  const originalPrepare = DatabaseSync.prototype.prepare;
  t.mock.method(DatabaseSync.prototype, "prepare", function tracedPrepare(sql) {
    const statement = originalPrepare.call(this, sql);
    if (/^\s*SELECT/i.test(sql)) {
      const trace = { sql: String(sql).replace(/\s+/g, " ").trim(), params: null };
      statements.push(trace);
      for (const method of ["all", "get"]) {
        const original = statement[method];
        t.mock.method(statement, method, function tracedRun(params) {
          trace.params = params;
          return arguments.length ? original.call(this, params) : original.call(this);
        });
      }
    }
    return statement;
  });

  const data = getWorkspaceData({
    range: "all", end: "2026-07-31", q: "Hotel", category: "viajes",
    sort: "lowest", offset: 1, limit: 1,
  }, new Date("2026-07-31T12:00:00Z"));

  assert.equal(data.summary.totalSpend, 2296.59);
  assert.deepEqual(data.transactions.map(({ id }) => id), [19]);
  assert.deepEqual(data.meta, {
    q: "Hotel", category: "viajes", sort: "lowest", offset: 1, limit: 1,
    hasMore: false, totalMatches: 2,
  });
  const page = statements.find(({ sql }) => /LIMIT :limit OFFSET :offset/.test(sql));
  assert.ok(page, "expected SQL pagination");
  assert.equal(page.params.q, "%hotel%");
  assert.equal(page.params.category, "viajes");
  assert.equal(page.params.limit, 1);
  assert.equal(statements.some(({ sql }) => /Hotel/.test(sql)), false, "search must not be interpolated into SQL");
});

test("bounds pagination and safely normalizes unsupported sorts", () => {
  const high = getWorkspaceData({ range: "all", end: "2026-07-31", offset: "-4", limit: "1000", sort: "DROP TABLE expenses" }, new Date("2026-07-31T12:00:00Z"));
  assert.equal(high.meta.offset, 0);
  assert.equal(high.meta.limit, 100);
  assert.equal(high.meta.sort, "newest");
  assert.equal(high.transactions[0].id, 24);

  const fallback = getWorkspaceData({ range: "all", end: "2026-07-31", limit: "n/a" }, new Date("2026-07-31T12:00:00Z"));
  assert.equal(fallback.meta.limit, 20);
});

test("rejects unsafe and non-integer offsets before binding SQLite pagination", () => {
  for (const offset of ["999999999999999999999999", "2.5", Number.POSITIVE_INFINITY]) {
    const data = getWorkspaceData({ range: "all", end: "2026-07-31", offset }, new Date("2026-07-31T12:00:00Z"));
    assert.equal(data.meta.offset, 0);
    assert.equal(data.transactions[0].id, 24);
  }
});

test("separates every monetary aggregate and ledger row by selected currency", () => {
  useTemporaryFixture((db) => {
    db.prepare(`
      INSERT INTO expenses
        (id, expense_date, description, amount, currency, category_id, paid_by_person_id, notes)
      VALUES (25, '2026-07-30', 'Euro meal', 33, 'EUR', 3, 2, 'Paid abroad')
    `).run();
    db.prepare("INSERT INTO expense_allocations (id, expense_id, person_id, percentage) VALUES (4, 25, 2, 50)").run();
  }, () => {
    const eur = getWorkspaceData({ range: "1m", end: "2026-07-31", currency: "EUR" }, new Date("2026-07-31T12:00:00Z"));
    assert.deepEqual(eur.currencies, ["EUR", "USD"]);
    assert.equal(eur.currency, "EUR");
    assert.deepEqual(eur.summary, {
      totalSpend: 33, expenseCount: 1, averageExpense: 33,
      previousSpend: 0, deltaAmount: 33, deltaPercent: null,
    });
    assert.deepEqual(eur.trend, [{ date: "2026-07-30", totalSpend: 33 }]);
    assert.deepEqual(eur.categories, [{ slug: "comida", name: "Food", totalSpend: 33, expenseCount: 1 }]);
    assert.deepEqual(eur.people, [{ slug: "alex", name: "Alex", totalPaid: 33, expenseCount: 1 }]);
    assert.deepEqual(eur.allocations, [{ slug: "alex", name: "Alex", totalAllocated: 16.5, allocationCount: 1 }]);
    assert.equal(eur.transactions.every(({ currency }) => currency === "EUR"), true);

    const usd = getWorkspaceData({ range: "1m", end: "2026-07-31", currency: "USD" }, new Date("2026-07-31T12:00:00Z"));
    assert.equal(usd.summary.totalSpend, 502.84);
    assert.equal(usd.categories.find(({ slug }) => slug === "comida").totalSpend, 235.35);
  });
});

test("All omits comparison while retaining all-time totals", () => {
  const data = getWorkspaceData({ range: "all", end: "2026-07-31" }, new Date("2026-07-31T12:00:00Z"));
  assert.equal(data.summary.totalSpend, 2296.59);
  assert.equal(data.summary.previousSpend, null);
  assert.equal(data.summary.deltaAmount, null);
  assert.equal(data.summary.deltaPercent, null);
});

test("returns stable empty shapes without inferring a latest date", () => {
  useTemporaryFixture((db) => db.exec("DELETE FROM expense_allocations; DELETE FROM expenses;"), () => {
    const data = getWorkspaceData({ range: "1m", end: "2026-07-31" }, new Date("2026-07-31T12:00:00Z"));
    assert.equal(data.currency, null);
    assert.deepEqual(data.currencies, []);
    assert.deepEqual(data.summary, {
      totalSpend: 0, expenseCount: 0, averageExpense: 0,
      previousSpend: 0, deltaAmount: 0, deltaPercent: null,
    });
    assert.deepEqual(data.trend, []);
    assert.deepEqual(data.categories, []);
    assert.deepEqual(data.people, []);
    assert.deepEqual(data.allocations, []);
    assert.deepEqual(data.transactions, []);
    assert.equal(data.meta.totalMatches, 0);
    assert.equal(data.meta.hasMore, false);
    assert.equal(data.latestDate, null);
  });
});

test("opens and closes exactly one read-only connection", (t) => {
  let opened = 0;
  let closed = 0;
  const originalClose = DatabaseSync.prototype.close;
  t.mock.method(DatabaseSync.prototype, "close", function tracedClose() {
    closed += 1;
    return originalClose.call(this);
  });
  const originalPrepare = DatabaseSync.prototype.prepare;
  t.mock.method(DatabaseSync.prototype, "prepare", function tracedPrepare(sql) {
    if (/^\s*SELECT/i.test(sql) && opened === 0) opened = 1;
    return originalPrepare.call(this, sql);
  });

  getWorkspaceData({ range: "1w", end: "2026-07-31" }, new Date("2026-07-31T12:00:00Z"));
  assert.equal(opened, 1);
  assert.equal(closed, 1);
});

test("workspace API forwards validated URL state and disables caching", async () => {
  const response = await GET(new Request("http://local/api/workspace?range=1w&end=2026-07-31&sort=highest&limit=2"));
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(data.range.from, "2026-07-25");
  assert.equal(data.summary.totalSpend, 108.09);
  assert.equal(data.meta.sort, "highest");
  assert.equal(data.meta.limit, 2);
});

test("workspace API returns a useful JSON error when its read-only source is unavailable", async () => {
  const previous = process.env.EXPENSE_DB_PATH;
  process.env.EXPENSE_DB_PATH = "/definitely/not/an/expense-database.db";
  try {
    const response = await GET(new Request("http://local/api/workspace"));
    const body = await response.json();
    assert.equal(response.status, 500);
    assert.match(body.error, /Unable to load spending workspace/);
  } finally {
    process.env.EXPENSE_DB_PATH = previous;
  }
});

test("calendar totals ignore rolling and ledger filters and stop at today", () => {
  const now = new Date("2026-07-31T12:00:00Z");
  const a = getWorkspaceData({ range: "1w", end: "2026-07-10", q: "nothing" }, now);
  const b = getWorkspaceData({ range: "all" }, now);
  assert.deepEqual(a.calendar, b.calendar);
  assert.equal(a.calendar.today, "2026-07-31");
  assert.equal(a.calendar.months.find(row => row.month === "2026-07").totalSpend, 597.84);
  const earlier = getWorkspaceData({}, new Date("2026-06-30T12:00:00Z"));
  assert.equal(earlier.calendar.months.some(row => row.month === "2026-07"), false);
});
