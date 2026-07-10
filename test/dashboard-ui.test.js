import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const homePage = readFileSync(new URL("../app/page.js", import.meta.url), "utf8");
const dashboardPrimitives = readFileSync(new URL("../components/DashboardPrimitives.js", import.meta.url), "utf8");
const interactiveDonut = readFileSync(new URL("../components/InteractiveDonut.js", import.meta.url), "utf8");
const queries = readFileSync(new URL("../lib/queries.js", import.meta.url), "utf8");

test("dashboard monthly trend spans the full content width", () => {
  assert.match(homePage, /<MonthlyTrend months=\{data\.monthlyTotals\} className="span-12" \/>/);
});

test("dashboard donut chart is interactive and can open filtered ledger views", () => {
  assert.match(dashboardPrimitives, /<InteractiveDonut categories=\{categories\} \/>/);
  assert.match(interactiveDonut, /router\.push\(`/);
  assert.doesNotMatch(interactiveDonut, /click to inspect/i);
  assert.match(interactiveDonut, /expenses/);
});


test("donut chart keeps interaction without decorative reveal motion", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(interactiveDonut, /donut-card/);
  assert.match(interactiveDonut, /key=\{active\?\.categorySlug \?\? "total"\}/);
  assert.doesNotMatch(styles, /\.donut-card \{[^}]*animation:/);
  assert.doesNotMatch(styles, /\.donut-slice \{[^}]*animation:/);
});


test("monthly trend card keeps the data readable without decorative choreography", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(dashboardPrimitives, /monthly-trend-card/);
  assert.match(styles, /\.month-track div \{[^}]*background: var\(--blue\);/);
  assert.doesNotMatch(styles, /\.monthly-trend-card \{[^}]*animation:/);
  assert.doesNotMatch(styles, /\.month-col \{[^}]*animation:/);
});


test("dashboard expense lists split the row evenly", () => {
  assert.match(homePage, /<ExpenseList title="Recent expenses" expenses=\{data\.recentExpenses\} className="span-6 dashboard-expense-list" showCategory={false} \/>/);
  assert.match(homePage, /<ExpenseList title="Largest expenses" expenses=\{data\.largestExpenses\} compact className="span-6 dashboard-expense-list" showCategory={false} \/>/);
  assert.match(dashboardPrimitives, /export function ExpenseList\(\{ title, expenses, compact = false, className = "", showCategory = true \}\)/);
  assert.match(dashboardPrimitives, /className \|\| \(compact \? "span-5" : "span-7"\)/);
});


test("dashboard expense lists stack earlier on tablet for legibility", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(homePage, /dashboard-expense-list/);
  assert.match(styles, /@media \(max-width: 980px\) \{[\s\S]*\.dashboard-expense-list \{ grid-column: span 12; \}/);
});


test("dashboard home expense lists can hide category chips", () => {
  assert.match(dashboardPrimitives, /showCategory = true/);
  assert.match(dashboardPrimitives, /<ExpenseRow expense=\{expense\} showCategory=\{showCategory\}/);
  assert.match(dashboardPrimitives, /showCategory \? <CategoryPill/);
  assert.match(homePage, /showCategory=\{false\}/);
});


test("dashboard copy uses clearer household-friendly language", () => {
  assert.match(homePage, /Read only/);
  assert.match(homePage, /Change from/);
  assert.match(homePage, /Largest expense this month/);
  assert.doesNotMatch(homePage, /Top category/);
  assert.match(homePage, /See this month's spending, biggest categories, recent purchases, and whether the data is up to date\./);
  assert.match(dashboardPrimitives, /Category totals/);
  assert.match(dashboardPrimitives, /Spending breakdown/);
  assert.match(dashboardPrimitives, /Recent spending/);
  assert.match(dashboardPrimitives, /Highest amounts/);
  assert.match(dashboardPrimitives, /Typical expense size/);
  assert.match(dashboardPrimitives, /Earliest matching expense/);
  assert.match(dashboardPrimitives, /Most recent matching expense/);
});

test("dashboard summary row uses three cards after removing top category", () => {
  assert.match(homePage, /className="metrics-grid dashboard-summary-metrics"/);
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(styles, /\.dashboard-summary-metrics \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
  assert.match(styles, /\.dashboard-summary-metrics > \.metric \{[\s\S]*grid-column: span 1;/);
});

test("dashboard leads with a period-explicit monthly comparison", () => {
  assert.match(homePage, /ChangeSummary comparison=\{data\.comparison\}/);
  assert.match(homePage, /Change from/);
  assert.match(homePage, /Largest expense this month/);
  assert.doesNotMatch(homePage, /Lifetime spend/);
  assert.match(dashboardPrimitives, /export function ChangeSummary/);
  assert.match(dashboardPrimitives, /import \{[^}]*monthLabel[^}]*\} from "\.\.\/lib\/format\.js"/);
});

test("dashboard query scopes the largest expense and exposes comparison data", () => {
  assert.match(queries, /buildDashboardComparison/);
  assert.match(queries, /const previousMonth = activeMonth \? shiftMonth\(activeMonth, -1\) : null/);
  assert.match(queries, /WHERE substr\(e\.expense_date, 1, 7\) = :activeMonth/);
  assert.match(queries, /\n\s+comparison,/);
});
