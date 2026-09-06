import { getDatabaseStatus, withDatabase } from "./db.js";
import { buildDashboardComparison } from "./dashboard-comparison.js";
import { buildSpendingComparison } from "./spending-comparison.js";
import { currentWeekBounds, monthBounds } from "./date-range.js";
import { normalizeCategoryValues } from "./transaction-filters.js";

const DEFAULT_TRANSACTION_LIMIT = 10;
const MAX_TRANSACTION_LIMIT = 200;

function all(db, sql, params = {}) {
  return db.prepare(sql).all(params).map((row) => ({ ...row }));
}

function get(db, sql, params = {}) {
  const row = db.prepare(sql).get(params);
  return row ? { ...row } : null;
}

function shiftMonth(monthValue, delta) {
  const [year, month] = monthValue.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function latestExpenseMonth(db) {
  const latest = get(db, `SELECT MAX(expense_date) AS latestDate FROM expenses`);
  return latest?.latestDate ? latest.latestDate.slice(0, 7) : null;
}

function rangeClause(bounds, alias = "e", prefix = "range") {
  if (!bounds?.from || !bounds?.to) return { sql: "", params: {} };
  return {
    sql: `${alias}.expense_date >= :${prefix}From AND ${alias}.expense_date < :${prefix}To`,
    params: { [`${prefix}From`]: bounds.from, [`${prefix}To`]: bounds.to },
  };
}

function monthClause(month, alias = "e", prefix = "month") {
  if (!month || month === "all") return { sql: "", params: {}, bounds: null };
  const bounds = monthBounds(month);
  return { ...rangeClause(bounds, alias, prefix), bounds };
}

function periodFilter(period, latestMonthValue, alias = "e") {
  const selectedPeriod = period || "all";
  if (!latestMonthValue || selectedPeriod === "all") {
    return { sql: "", params: {}, label: "All time", selectedPeriod: "all", dateRange: { from: null, to: null } };
  }

  let fromMonth;
  let label;
  if (selectedPeriod === "this_month") {
    fromMonth = latestMonthValue;
    label = "This month";
  } else if (selectedPeriod === "last_month") {
    fromMonth = shiftMonth(latestMonthValue, -1);
    label = "Last month";
  } else if (selectedPeriod === "last_3_months") {
    fromMonth = shiftMonth(latestMonthValue, -2);
    label = "Last 3 months";
  } else if (selectedPeriod === "ytd") {
    fromMonth = `${latestMonthValue.slice(0, 4)}-01`;
    label = "Year to date";
  } else {
    return { sql: "", params: {}, label: "All time", selectedPeriod: "all", dateRange: { from: null, to: null } };
  }

  const bounds = {
    from: `${fromMonth}-01`,
    to: selectedPeriod === "last_month" ? monthBounds(fromMonth).to : monthBounds(latestMonthValue).to,
  };
  return { ...rangeClause(bounds, alias, "period"), label, selectedPeriod, dateRange: bounds };
}

function sortClause(sort) {
  switch (sort) {
    case "oldest": return "ORDER BY e.expense_date ASC, e.id ASC";
    case "highest": return "ORDER BY e.amount DESC, e.expense_date DESC, e.id DESC";
    case "lowest": return "ORDER BY e.amount ASC, e.expense_date ASC, e.id ASC";
    default: return "ORDER BY e.expense_date DESC, e.id DESC";
  }
}

function summaryQuery(db, filter = { sql: "", params: {} }) {
  return get(db, `
    SELECT COUNT(*) AS expenseCount,
           ROUND(COALESCE(SUM(e.amount), 0), 2) AS totalSpend,
           ROUND(COALESCE(AVG(e.amount), 0), 2) AS averageExpense,
           MIN(e.expense_date) AS firstExpenseDate,
           MAX(e.expense_date) AS latestExpenseDate
    FROM expenses e
    ${filter.sql ? `WHERE ${filter.sql}` : ""}
  `, filter.params);
}

function categoryTotals(db, filter = { sql: "", params: {} }) {
  return all(db, `
    SELECT c.name AS category, c.slug AS categorySlug, COUNT(*) AS expenseCount,
           ROUND(SUM(e.amount), 2) AS totalSpend, ROUND(AVG(e.amount), 2) AS averageExpense,
           MIN(e.expense_date) AS firstDate, MAX(e.expense_date) AS latestDate
    FROM expenses e JOIN categories c ON c.id = e.category_id
    ${filter.sql ? `WHERE ${filter.sql}` : ""}
    GROUP BY c.id ORDER BY totalSpend DESC, c.name ASC
  `, filter.params);
}

function monthCatalog(db) {
  const months = all(db, `
    SELECT substr(expense_date, 1, 7) AS value, COUNT(*) AS expenseCount,
           ROUND(SUM(amount), 2) AS totalSpend
    FROM expenses GROUP BY value ORDER BY value DESC
  `);
  return [{ value: "all", label: "All", expenseCount: null, totalSpend: null }, ...months.map((row) => ({ ...row, label: row.value }))];
}

function monthlyTotals(db) {
  return all(db, `
    SELECT substr(expense_date, 1, 7) AS month, COUNT(*) AS expenseCount,
           ROUND(SUM(amount), 2) AS totalSpend, ROUND(AVG(amount), 2) AS averageExpense
    FROM expenses GROUP BY month ORDER BY month ASC
  `);
}

function expenseRows(db, { whereSql = "", params = {}, orderSql = "ORDER BY e.expense_date DESC, e.id DESC", limit = null, offset = 0, notes = true } = {}) {
  const paginationSql = limit === null ? "" : "LIMIT :rowLimit OFFSET :rowOffset";
  const queryParams = limit === null ? params : { ...params, rowLimit: limit, rowOffset: offset };
  return all(db, `
    SELECT e.id, e.expense_date AS date, e.description, e.amount, e.currency,
           c.name AS category, c.slug AS categorySlug, p.display_name AS paidBy${notes ? ", e.notes" : ""}
    FROM expenses e
    JOIN categories c ON c.id = e.category_id
    JOIN persons p ON p.id = e.paid_by_person_id
    ${whereSql ? `WHERE ${whereSql}` : ""}
    ${orderSql}
    ${paginationSql}
  `, queryParams);
}

function dailyTotals(db, filter) {
  if (!filter?.sql) return [];
  return all(db, `
    SELECT expense_date AS date, COUNT(*) AS expenseCount, ROUND(SUM(amount), 2) AS totalSpend
    FROM expenses e WHERE ${filter.sql}
    GROUP BY expense_date ORDER BY expense_date ASC
  `, filter.params);
}

export function getAvailableMonths() {
  return withDatabase((db) => monthCatalog(db));
}

export function getSpendingData({ month } = {}) {
  return withDatabase((db) => {
    const activeMonth = month || latestExpenseMonth(db) || "all";
    const previousMonth = activeMonth !== "all" ? shiftMonth(activeMonth, -1) : null;
    const filter = monthClause(activeMonth, "e", "current");
    const previousFilter = monthClause(previousMonth, "e", "previous");
    const summary = summaryQuery(db, filter);
    const categories = categoryTotals(db, filter);
    const previousSummary = previousMonth ? summaryQuery(db, previousFilter) : null;
    const previousCategories = previousMonth ? categoryTotals(db, previousFilter) : [];
    return {
      db: getDatabaseStatus(), activeMonth, previousMonth,
      label: activeMonth === "all" ? "All time" : activeMonth,
      months: monthCatalog(db), summary, previousSummary,
      comparison: buildSpendingComparison({ activeMonth, previousMonth, currentCategories: categories, previousCategories }),
      topCategory: categories[0] || null, categories, monthlyTotals: monthlyTotals(db),
    };
  });
}

function transactionOptions(options, { latestMonthValue = null, allowedSlugs } = {}) {
  const { q = "", period = "all", month = "all", category = "all", categories: rawCategories, sort = "newest", offset: rawOffset = 0, limit: rawLimit = DEFAULT_TRANSACTION_LIMIT } = options || {};
  const parsedOffset = Number.parseInt(`${rawOffset}`, 10);
  const parsedLimit = Number.parseInt(`${rawLimit}`, 10);
  const offset = Number.isFinite(parsedOffset) && parsedOffset > 0 ? parsedOffset : 0;
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), MAX_TRANSACTION_LIMIT) : DEFAULT_TRANSACTION_LIMIT;
  const cleanQuery = String(q || "").trim();
  const selectedMonth = month || "all";
  const periodState = selectedMonth !== "all"
    ? { sql: "", params: {}, selectedPeriod: "all", label: "All time", dateRange: { from: null, to: null } }
    : periodFilter(period, latestMonthValue, "e");
  const params = {};
  const where = [];
  if (cleanQuery) {
    where.push("(lower(e.description) LIKE :q OR lower(COALESCE(e.notes, '')) LIKE :q)");
    params.q = `%${cleanQuery.toLowerCase()}%`;
  }
  const selectedMonthFilter = monthClause(selectedMonth, "e", "selectedMonth");
  if (selectedMonthFilter.sql) {
    where.push(selectedMonthFilter.sql);
    Object.assign(params, selectedMonthFilter.params);
  }
  if (periodState.sql) {
    where.push(periodState.sql);
    Object.assign(params, periodState.params);
  }
  const selectedCategories = normalizeCategoryValues(rawCategories ?? category, allowedSlugs);
  if (selectedCategories.length) {
    const placeholders = selectedCategories.map((slug, index) => {
      const key = `category${index}`;
      params[key] = slug;
      return `:${key}`;
    });
    where.push(`c.slug IN (${placeholders.join(", ")})`);
  }
  return { cleanQuery, selectedMonth, periodState, selectedCategories, params, where, sort, offset, limit };
}

function needsLatestMonth(options = {}) {
  return (options.month || "all") === "all" && ["this_month", "last_month", "last_3_months", "ytd"].includes(options.period);
}

function transactionsPageFromDb(db, options, allowedSlugs, latestMonthValue) {
  const state = transactionOptions(options, { latestMonthValue, allowedSlugs });
  const whereSql = state.where.join(" AND ");
  const transactions = expenseRows(db, {
    whereSql, params: state.params, orderSql: sortClause(state.sort), limit: state.limit, offset: state.offset,
  });
  const summary = get(db, `
    SELECT COUNT(*) AS expenseCount, ROUND(COALESCE(SUM(e.amount), 0), 2) AS totalSpend,
           ROUND(COALESCE(AVG(e.amount), 0), 2) AS averageExpense,
           MIN(e.expense_date) AS firstExpenseDate, MAX(e.expense_date) AS latestExpenseDate
    FROM expenses e JOIN categories c ON c.id = e.category_id
    ${whereSql ? `WHERE ${whereSql}` : ""}
  `, state.params);
  return {
    transactions, summary,
    meta: {
      q: state.cleanQuery, period: state.periodState.selectedPeriod, periodLabel: state.periodState.label,
      month: state.selectedMonth, category: state.selectedCategories[0] || "all", categories: state.selectedCategories,
      sort: state.sort, offset: state.offset, limit: state.limit, dateRange: state.periodState.dateRange,
      totalRows: summary?.expenseCount || 0,
      hasMore: state.offset + transactions.length < (summary?.expenseCount || 0),
    },
  };
}

export function getTransactionsPageData(options = {}) {
  return withDatabase((db) => {
    const latestMonthValue = needsLatestMonth(options) ? latestExpenseMonth(db) : null;
    const requestedCategories = normalizeCategoryValues(options.categories ?? options.category);
    let allowedSlugs;
    if (requestedCategories.length) {
      const params = {};
      const placeholders = requestedCategories.map((slug, index) => {
        const key = `validationCategory${index}`;
        params[key] = slug;
        return `:${key}`;
      });
      allowedSlugs = all(db, `
        SELECT slug FROM categories
        WHERE slug IN (${placeholders.join(", ")})
      `, params).map(({ slug }) => slug);
    }
    return transactionsPageFromDb(db, options, allowedSlugs, latestMonthValue);
  });
}

export function getTransactionsData(options = {}) {
  return withDatabase((db) => {
    const latestMonthValue = needsLatestMonth(options) ? latestExpenseMonth(db) : null;
    const base = transactionOptions(options, { latestMonthValue });
    const availabilityWhere = base.where.filter((clause) => !clause.startsWith("c.slug IN"));
    const availabilityParams = Object.fromEntries(Object.entries(base.params).filter(([key]) => !key.startsWith("category")));
    const categories = all(db, `
      SELECT c.slug, c.name, COUNT(e.id) AS expenseCount
      FROM categories c
      LEFT JOIN expenses e ON e.category_id = c.id${availabilityWhere.length ? ` AND ${availabilityWhere.join(" AND ")}` : ""}
      GROUP BY c.id, c.slug, c.name ORDER BY c.name ASC
    `, availabilityParams);
    const data = transactionsPageFromDb(db, options, categories.map(({ slug }) => slug), latestMonthValue);
    return { db: getDatabaseStatus(), ...data, categories, months: monthCatalog(db) };
  });
}

export function getTransactionDetailData({ id } = {}) {
  return withDatabase((db) => {
    const transaction = get(db, `
      SELECT e.id, e.expense_date AS date, e.description, e.amount, e.currency,
             c.name AS category, c.slug AS categorySlug, p.display_name AS paidBy, e.notes
      FROM expenses e JOIN categories c ON c.id = e.category_id JOIN persons p ON p.id = e.paid_by_person_id
      WHERE e.id = :id
    `, { id });
    if (!transaction) return null;
    transaction.allocations = all(db, `
      SELECT p.display_name AS name, p.slug, a.percentage,
             ROUND(:amount * a.percentage / 100.0, 2) AS amount
      FROM expense_allocations a JOIN persons p ON p.id = a.person_id
      WHERE a.expense_id = :id ORDER BY p.display_name, p.id
    `, { id: transaction.id, amount: transaction.amount });
    const month = transaction.date.slice(0, 7);
    const previousMonth = shiftMonth(month, -1);
    const current = monthClause(month, "e", "current");
    const previous = monthClause(previousMonth, "e", "previous");
    const params = { ...current.params, categorySlug: transaction.categorySlug, currency: transaction.currency };
    const aggregate = get(db, `
      SELECT COUNT(*) AS expenseCount, ROUND(COALESCE(SUM(e.amount), 0), 2) AS totalSpend,
             ROUND(COALESCE(AVG(e.amount), 0), 2) AS averageExpense
      FROM expenses e JOIN categories c ON c.id = e.category_id
      WHERE ${current.sql} AND c.slug = :categorySlug AND e.currency = :currency
    `, params);
    const previousTotal = get(db, `
      SELECT ROUND(COALESCE(SUM(e.amount), 0), 2) AS totalSpend
      FROM expenses e JOIN categories c ON c.id = e.category_id
      WHERE ${previous.sql} AND c.slug = :categorySlug AND e.currency = :currency
    `, { ...previous.params, categorySlug: transaction.categorySlug, currency: transaction.currency });
    const daily = all(db, `
      SELECT e.expense_date AS date, ROUND(SUM(e.amount), 2) AS totalSpend, COUNT(*) AS expenseCount
      FROM expenses e JOIN categories c ON c.id = e.category_id
      WHERE ${current.sql} AND c.slug = :categorySlug AND e.currency = :currency
      GROUP BY e.expense_date ORDER BY e.expense_date ASC
    `, params);
    const expenses = expenseRows(db, {
      whereSql: `${current.sql} AND c.slug = :categorySlug AND e.currency = :currency`, params,
      orderSql: "ORDER BY e.expense_date DESC, e.id DESC",
    });
    const totalSpend = Number(aggregate?.totalSpend || 0);
    const previousTotalSpend = Number(previousTotal?.totalSpend || 0);
    const deltaAmount = Math.round((totalSpend - previousTotalSpend) * 100) / 100;
    const deltaPercent = previousTotalSpend > 0 ? Math.round((deltaAmount / previousTotalSpend) * 10000) / 100 : null;
    return {
      transaction,
      categoryMonth: {
        month, previousMonth, category: transaction.category, categorySlug: transaction.categorySlug,
        totalSpend, expenseCount: Number(aggregate?.expenseCount || 0), averageExpense: Number(aggregate?.averageExpense || 0),
        previousTotalSpend, deltaAmount, deltaPercent, isNewThisMonth: previousTotalSpend === 0,
        selectedDate: transaction.date, dailyTotals: daily, expenses,
      },
    };
  });
}

export function getPeopleData() {
  return withDatabase((db) => {
    const people = all(db, `
      SELECT p.display_name AS person, p.slug, COUNT(e.id) AS expenseCount,
             ROUND(COALESCE(SUM(e.amount), 0), 2) AS totalPaid
      FROM persons p LEFT JOIN expenses e ON e.paid_by_person_id = p.id
      GROUP BY p.id ORDER BY totalPaid DESC, p.display_name ASC
    `);
    const allocations = all(db, `
      SELECT p.display_name AS person, p.slug, COUNT(a.id) AS allocationCount,
             ROUND(COALESCE(SUM(e.amount * a.percentage / 100.0), 0), 2) AS allocatedTotal
      FROM persons p LEFT JOIN expense_allocations a ON a.person_id = p.id
      LEFT JOIN expenses e ON e.id = a.expense_id
      GROUP BY p.id ORDER BY allocatedTotal DESC, p.display_name ASC
    `);
    return { db: getDatabaseStatus(), people, allocations };
  });
}

export function getStatusData() {
  return withDatabase((db) => ({ db: getDatabaseStatus(), overview: summaryQuery(db) }));
}

function nextDay(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getDashboardData() {
  return withDatabase((db) => {
    const activeMonth = latestExpenseMonth(db);
    const previousMonth = activeMonth ? shiftMonth(activeMonth, -1) : null;
    const activeFilter = monthClause(activeMonth, "e", "current");
    const previousFilter = monthClause(previousMonth, "e", "previous");
    const activeSummary = activeMonth ? summaryQuery(db, activeFilter) : { expenseCount: 0, totalSpend: 0, averageExpense: 0 };
    const month = { activeMonth, expenseCount: activeSummary.expenseCount, totalSpend: activeSummary.totalSpend, averageExpense: activeSummary.averageExpense };
    const previousSummary = previousMonth ? summaryQuery(db, previousFilter) : { expenseCount: 0, totalSpend: 0 };
    const comparisonRows = activeMonth && previousMonth ? all(db, `
      SELECT c.name AS category, c.slug AS categorySlug,
             ROUND(COALESCE(SUM(CASE WHEN e.expense_date >= :currentFrom AND e.expense_date < :currentTo THEN e.amount ELSE 0 END), 0), 2) AS currentTotal,
             ROUND(COALESCE(SUM(CASE WHEN e.expense_date >= :previousFrom AND e.expense_date < :previousTo THEN e.amount ELSE 0 END), 0), 2) AS previousTotal
      FROM categories c
      LEFT JOIN expenses e ON e.category_id = c.id AND e.expense_date >= :previousFrom AND e.expense_date < :currentTo
      GROUP BY c.id
      HAVING SUM(CASE WHEN e.expense_date >= :previousFrom AND e.expense_date < :currentTo THEN e.amount ELSE 0 END) != 0
    `, { ...activeFilter.params, ...previousFilter.params }) : [];
    const categories = activeMonth ? categoryTotals(db, activeFilter) : [];
    const currentLargest = activeMonth ? expenseRows(db, {
      whereSql: activeFilter.sql, params: activeFilter.params,
      orderSql: "ORDER BY e.amount DESC, e.expense_date DESC, e.id DESC", limit: 6, notes: false,
    }) : [];
    const week = currentWeekBounds();
    const year = activeMonth?.slice(0, 4);
    const yearFilter = year ? rangeClause({ from: `${year}-01-01`, to: `${Number(year) + 1}-01-01` }, "e", "year") : null;
    return {
      db: getDatabaseStatus(), month,
      comparison: buildDashboardComparison({ currentMonth: activeMonth, previousMonth, currentTotal: month.totalSpend, previousTotal: previousSummary.totalSpend, categoryRows: comparisonRows }),
      largestExpense: currentLargest[0] || null,
      categories,
      recentExpenses: expenseRows(db, { limit: 10 }),
      largestExpensesByRange: {
        week: expenseRows(db, { whereSql: "e.expense_date >= :weekFrom AND e.expense_date < :weekTo", params: { weekFrom: week.start, weekTo: nextDay(week.end) }, orderSql: "ORDER BY e.amount DESC, e.expense_date DESC, e.id DESC", limit: 6, notes: false }),
        month: currentLargest,
        year: yearFilter ? expenseRows(db, { whereSql: yearFilter.sql, params: yearFilter.params, orderSql: "ORDER BY e.amount DESC, e.expense_date DESC, e.id DESC", limit: 6, notes: false }) : [],
      },
      monthlyTotals: monthlyTotals(db),
      dailyTotals: activeMonth ? dailyTotals(db, activeFilter) : [],
      previousDailyTotals: previousMonth ? dailyTotals(db, previousFilter) : [],
    };
  });
}
