import { getDatabaseStatus, withDatabase } from "./db.js";
import { normalizeWorkspaceOffset, resolveWorkspaceRange } from "./workspace-range.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const SORT_SQL = Object.freeze({
  newest: "e.expense_date DESC, e.id DESC",
  highest: "e.amount DESC, e.expense_date DESC, e.id DESC",
  lowest: "e.amount ASC, e.expense_date ASC, e.id ASC",
});

function all(db, sql, params = {}) {
  return db.prepare(sql).all(params).map((row) => ({ ...row }));
}

function get(db, sql, params = {}) {
  const row = db.prepare(sql).get(params);
  return row ? { ...row } : null;
}

function normalizeOptions(options) {
  const rawLimit = Number.parseInt(String(options.limit ?? DEFAULT_LIMIT), 10);
  return {
    q: String(options.q || "").trim(),
    category: options.category && options.category !== "all" ? String(options.category) : "all",
    sort: Object.hasOwn(SORT_SQL, options.sort) ? options.sort : "newest",
    offset: normalizeWorkspaceOffset(options.offset),
    limit: Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), MAX_LIMIT) : DEFAULT_LIMIT,
  };
}

function rangePredicate(range, alias = "e", prefix = "current") {
  if (!range.from || !range.to) return { sql: "", params: {} };
  return {
    sql: `${alias}.expense_date >= :${prefix}From AND ${alias}.expense_date < :${prefix}To`,
    params: { [`${prefix}From`]: range.from, [`${prefix}To`]: range.to },
  };
}

function aggregate(db, currency, filter) {
  return get(db, `
    SELECT COUNT(*) AS expenseCount,
           ROUND(COALESCE(SUM(e.amount), 0), 2) AS totalSpend,
           ROUND(COALESCE(AVG(e.amount), 0), 2) AS averageExpense
    FROM expenses e
    WHERE e.currency = :currency${filter.sql ? ` AND ${filter.sql}` : ""}
  `, { currency, ...filter.params });
}

function money(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function percent(value) {
  return Math.round(value * 100) / 100;
}

function workspaceFromDb(db, options, range, now) {
  const currencies = all(db, "SELECT DISTINCT currency FROM expenses ORDER BY currency ASC").map(({ currency }) => currency);
  const requestedCurrency = String(options.currency || "");
  const currency = currencies.includes(requestedCurrency)
    ? requestedCurrency
    : currencies.includes("USD") ? "USD" : currencies[0] || null;
  const currentFilter = rangePredicate(range);
  const current = aggregate(db, currency, currentFilter);
  const previousFilter = range.previousFrom
    ? rangePredicate({ from: range.previousFrom, to: range.previousTo }, "e", "previous")
    : null;
  const previous = previousFilter ? aggregate(db, currency, previousFilter) : null;
  const totalSpend = money(current?.totalSpend);
  const previousSpend = previous ? money(previous.totalSpend) : null;
  const deltaAmount = previous ? money(totalSpend - previousSpend) : null;
  const deltaPercent = previousSpend > 0 ? percent((deltaAmount / previousSpend) * 100) : null;
  const baseWhere = [`e.currency = :currency`];
  const baseParams = { currency, ...currentFilter.params };
  if (currentFilter.sql) baseWhere.push(currentFilter.sql);
  const baseSql = baseWhere.join(" AND ");

  const trend = all(db, `
    SELECT e.expense_date AS date, ROUND(SUM(e.amount), 2) AS totalSpend
    FROM expenses e WHERE ${baseSql}
    GROUP BY e.expense_date ORDER BY e.expense_date ASC
  `, baseParams);
  const categories = all(db, `
    SELECT c.slug, c.name, ROUND(SUM(e.amount), 2) AS totalSpend, COUNT(*) AS expenseCount
    FROM expenses e JOIN categories c ON c.id = e.category_id
    WHERE ${baseSql}
    GROUP BY c.id, c.slug, c.name ORDER BY totalSpend DESC, c.name ASC
  `, baseParams);
  const people = all(db, `
    SELECT p.slug, p.display_name AS name, ROUND(SUM(e.amount), 2) AS totalPaid, COUNT(*) AS expenseCount
    FROM expenses e JOIN persons p ON p.id = e.paid_by_person_id
    WHERE ${baseSql}
    GROUP BY p.id, p.slug, p.display_name ORDER BY totalPaid DESC, p.display_name ASC
  `, baseParams);
  const allocations = all(db, `
    SELECT p.slug, p.display_name AS name,
           ROUND(SUM(e.amount * a.percentage / 100.0), 2) AS totalAllocated,
           COUNT(a.id) AS allocationCount
    FROM expenses e
    JOIN expense_allocations a ON a.expense_id = e.id
    JOIN persons p ON p.id = a.person_id
    WHERE ${baseSql}
    GROUP BY p.id, p.slug, p.display_name ORDER BY totalAllocated DESC, p.display_name ASC
  `, baseParams);

  const ledger = normalizeOptions(options);
  const ledgerWhere = [...baseWhere];
  const ledgerParams = { ...baseParams };
  if (ledger.q) {
    ledgerWhere.push("(lower(e.description) LIKE :q OR lower(COALESCE(e.notes, '')) LIKE :q)");
    ledgerParams.q = `%${ledger.q.toLowerCase()}%`;
  }
  if (ledger.category !== "all") {
    ledgerWhere.push("c.slug = :category");
    ledgerParams.category = ledger.category;
  }
  const ledgerSql = ledgerWhere.join(" AND ");
  const match = get(db, `
    SELECT COUNT(*) AS totalMatches
    FROM expenses e JOIN categories c ON c.id = e.category_id
    WHERE ${ledgerSql}
  `, ledgerParams);
  const transactions = all(db, `
    SELECT e.id, e.expense_date AS date, e.description, e.amount, e.currency,
           c.name AS category, c.slug AS categorySlug, p.display_name AS paidBy, e.notes
    FROM expenses e
    JOIN categories c ON c.id = e.category_id
    JOIN persons p ON p.id = e.paid_by_person_id
    WHERE ${ledgerSql}
    ORDER BY ${SORT_SQL[ledger.sort]}
    LIMIT :limit OFFSET :offset
  `, { ...ledgerParams, limit: ledger.limit, offset: ledger.offset });
  const totalMatches = Number(match?.totalMatches || 0);
  const latest = get(db, "SELECT MAX(expense_date) AS latestDate FROM expenses WHERE currency = :currency", { currency });

  return {
    range,
    currency,
    currencies,
    calendar: {
      today: now.toLocaleDateString("en-CA"),
      months: all(db, `
        SELECT substr(expense_date, 1, 7) AS month,
               ROUND(SUM(amount), 2) AS totalSpend
        FROM expenses
        WHERE currency = :currency AND expense_date <= :today
        GROUP BY substr(expense_date, 1, 7)
        ORDER BY month
      `, { currency, today: now.toLocaleDateString("en-CA") }),
    },
    summary: {
      totalSpend,
      expenseCount: Number(current?.expenseCount || 0),
      averageExpense: money(current?.averageExpense),
      previousSpend,
      deltaAmount,
      deltaPercent,
    },
    trend,
    categories,
    people,
    allocations,
    transactions,
    meta: {
      ...ledger,
      hasMore: ledger.offset + transactions.length < totalMatches,
      totalMatches,
    },
    latestDate: latest?.latestDate || null,
    status: getDatabaseStatus(),
  };
}

export function getWorkspaceData(options = {}, now = new Date()) {
  const range = resolveWorkspaceRange(options, now);
  return withDatabase((db) => workspaceFromDb(db, options, range, now));
}
