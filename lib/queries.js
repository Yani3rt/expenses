import { getDatabaseStatus, withDatabase } from "./db.js";

function all(db, sql, params = {}) {
  return db.prepare(sql).all(params).map((row) => ({ ...row }));
}

function get(db, sql, params = {}) {
  const row = db.prepare(sql).get(params);
  return row ? { ...row } : null;
}

function latestExpenseMonth(db) {
  const latest = get(db, `SELECT MAX(expense_date) AS latestDate FROM expenses`);
  return latest?.latestDate ? latest.latestDate.slice(0, 7) : null;
}

function monthClause(month, alias = "e") {
  if (!month || month === "all") return { sql: "", params: {} };
  return {
    sql: `WHERE substr(${alias}.expense_date, 1, 7) = :month`,
    params: { month },
  };
}

export function getAvailableMonths() {
  return withDatabase((db) => {
    const months = all(db, `
      SELECT substr(expense_date, 1, 7) AS value, COUNT(*) AS expenseCount,
             ROUND(SUM(amount), 2) AS totalSpend
      FROM expenses
      GROUP BY value
      ORDER BY value DESC
    `);

    return [
      { value: "all", label: "All", expenseCount: null, totalSpend: null },
      ...months.map((month) => ({ ...month, label: month.value })),
    ];
  });
}

export function getCategoriesCatalog() {
  return withDatabase((db) => all(db, `SELECT slug, name FROM categories ORDER BY name ASC`));
}

export function getSpendingData({ month } = {}) {
  return withDatabase((db) => {
    const activeMonth = month || latestExpenseMonth(db) || "all";
    const filter = monthClause(activeMonth);
    const label = activeMonth === "all" ? "All time" : activeMonth;

    const summary = get(db, `
      SELECT COUNT(*) AS expenseCount,
             ROUND(COALESCE(SUM(amount), 0), 2) AS totalSpend,
             ROUND(COALESCE(AVG(amount), 0), 2) AS averageExpense,
             MIN(expense_date) AS firstExpenseDate,
             MAX(expense_date) AS latestExpenseDate
      FROM expenses e
      ${filter.sql}
    `, filter.params);

    const categories = all(db, `
      SELECT c.name AS category, c.slug AS categorySlug, COUNT(*) AS expenseCount,
             ROUND(SUM(e.amount), 2) AS totalSpend,
             ROUND(AVG(e.amount), 2) AS averageExpense,
             MIN(e.expense_date) AS firstDate,
             MAX(e.expense_date) AS latestDate
      FROM expenses e
      JOIN categories c ON c.id = e.category_id
      ${filter.sql}
      GROUP BY c.id
      ORDER BY totalSpend DESC
    `, filter.params);

    const topCategory = categories[0] || null;
    const monthlyTotals = all(db, `
      SELECT substr(expense_date, 1, 7) AS month, COUNT(*) AS expenseCount,
             ROUND(SUM(amount), 2) AS totalSpend,
             ROUND(AVG(amount), 2) AS averageExpense
      FROM expenses
      GROUP BY month
      ORDER BY month ASC
    `);

    return {
      db: getDatabaseStatus(),
      activeMonth,
      label,
      months: getAvailableMonths(),
      summary,
      topCategory,
      categories,
      monthlyTotals,
    };
  });
}

export function getTransactionsData({ q = "", period = "all", month = "all", category = "all" } = {}) {
  return withDatabase((db) => {
    const params = {};
    const where = [];
    const cleanQuery = String(q || "").trim();
    const selectedPeriod = "all";
    const selectedMonth = month || latestExpenseMonth(db) || "all";
    let dateRange = { from: null, to: null };

    if (cleanQuery) {
      where.push("(lower(e.description) LIKE :q OR lower(COALESCE(e.notes, '')) LIKE :q)");
      params.q = `%${cleanQuery.toLowerCase()}%`;
    }

    if (category && category !== "all") {
      where.push("c.slug = :category");
      params.category = category;
    }

    if (selectedMonth !== "all") {
      where.push("substr(e.expense_date, 1, 7) = :month");
      params.month = selectedMonth;
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const transactions = all(db, `
      SELECT e.id, e.expense_date AS date, e.description, e.amount, e.currency,
             c.name AS category, c.slug AS categorySlug, p.display_name AS paidBy, e.notes
      FROM expenses e
      JOIN categories c ON c.id = e.category_id
      JOIN persons p ON p.id = e.paid_by_person_id
      ${whereSql}
      ORDER BY e.expense_date DESC, e.id DESC
      LIMIT 200
    `, params);

    const summary = get(db, `
      SELECT COUNT(*) AS expenseCount,
             ROUND(COALESCE(SUM(e.amount), 0), 2) AS totalSpend,
             ROUND(COALESCE(AVG(e.amount), 0), 2) AS averageExpense,
             MIN(e.expense_date) AS firstExpenseDate,
             MAX(e.expense_date) AS latestExpenseDate
      FROM expenses e
      JOIN categories c ON c.id = e.category_id
      JOIN persons p ON p.id = e.paid_by_person_id
      ${whereSql}
    `, params);

    return {
      db: getDatabaseStatus(),
      transactions,
      summary,
      categories: getCategoriesCatalog(),
      months: getAvailableMonths(),
      meta: {
        q: cleanQuery,
        period: selectedPeriod,
        month: selectedMonth,
        category: category || "all",
        dateRange,
      },
    };
  });
}

export function getPeopleData() {
  return withDatabase((db) => {
    const people = all(db, `
      SELECT p.display_name AS person, p.slug, COUNT(e.id) AS expenseCount,
             ROUND(COALESCE(SUM(e.amount), 0), 2) AS totalPaid
      FROM persons p
      LEFT JOIN expenses e ON e.paid_by_person_id = p.id
      GROUP BY p.id
      ORDER BY totalPaid DESC, p.display_name ASC
    `);

    const allocations = all(db, `
      SELECT p.display_name AS person, p.slug, COUNT(a.id) AS allocationCount,
             ROUND(COALESCE(SUM(e.amount * a.percentage / 100.0), 0), 2) AS allocatedTotal
      FROM persons p
      LEFT JOIN expense_allocations a ON a.person_id = p.id
      LEFT JOIN expenses e ON e.id = a.expense_id
      GROUP BY p.id
      ORDER BY allocatedTotal DESC, p.display_name ASC
    `);

    return { db: getDatabaseStatus(), people, allocations };
  });
}

export function getDashboardData() {
  return withDatabase((db) => {
    const activeMonth = latestExpenseMonth(db);
    const overview = get(db, `
      SELECT COUNT(*) AS expenseCount,
        ROUND(COALESCE(SUM(amount), 0), 2) AS totalSpend,
        ROUND(COALESCE(AVG(amount), 0), 2) AS averageExpense,
        MIN(expense_date) AS firstExpenseDate,
        MAX(expense_date) AS latestExpenseDate
      FROM expenses
    `);

    const month = activeMonth
      ? get(db, `
          SELECT :activeMonth AS activeMonth, COUNT(*) AS expenseCount,
            ROUND(COALESCE(SUM(amount), 0), 2) AS totalSpend,
            ROUND(COALESCE(AVG(amount), 0), 2) AS averageExpense
          FROM expenses
          WHERE substr(expense_date, 1, 7) = :activeMonth
        `, { activeMonth })
      : { activeMonth: null, expenseCount: 0, totalSpend: 0, averageExpense: 0 };

    const largestExpense = get(db, `
      SELECT e.id, e.expense_date AS date, e.description, e.amount, e.currency,
             c.name AS category, c.slug AS categorySlug, p.display_name AS paidBy
      FROM expenses e
      JOIN categories c ON c.id = e.category_id
      JOIN persons p ON p.id = e.paid_by_person_id
      ORDER BY e.amount DESC, e.expense_date DESC
      LIMIT 1
    `);

    const topCategory = get(db, `
      SELECT c.name AS category, c.slug AS categorySlug, COUNT(*) AS expenseCount,
             ROUND(SUM(e.amount), 2) AS totalSpend
      FROM expenses e
      JOIN categories c ON c.id = e.category_id
      GROUP BY c.id
      ORDER BY totalSpend DESC
      LIMIT 1
    `);

    const spending = getSpendingData({ month: activeMonth || "all" });
    const transactions = getTransactionsData();

    return {
      db: getDatabaseStatus(),
      overview,
      month,
      largestExpense,
      topCategory,
      categories: spending.categories,
      recentExpenses: transactions.transactions.slice(0, 8),
      largestExpenses: all(db, `
        SELECT e.id, e.expense_date AS date, e.description, e.amount, e.currency,
               c.name AS category, c.slug AS categorySlug, p.display_name AS paidBy
        FROM expenses e
        JOIN categories c ON c.id = e.category_id
        JOIN persons p ON p.id = e.paid_by_person_id
        ORDER BY e.amount DESC, e.expense_date DESC
        LIMIT 6
      `),
      monthlyTotals: spending.monthlyTotals,
    };
  });
}
