import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const homePage = readFileSync(new URL("../app/page.js", import.meta.url), "utf8");
const dashboardPrimitives = readFileSync(new URL("../components/DashboardPrimitives.js", import.meta.url), "utf8");
const interactiveDonut = readFileSync(new URL("../components/InteractiveDonut.js", import.meta.url), "utf8");

test("dashboard monthly trend spans the full content width", () => {
  assert.match(homePage, /<MonthlyTrend months=\{data\.monthlyTotals\} className="span-12" \/>/);
});

test("dashboard donut chart is interactive and can open filtered ledger views", () => {
  assert.match(dashboardPrimitives, /<InteractiveDonut categories=\{categories\} \/>/);
  assert.match(interactiveDonut, /router\.push\(`/);
  assert.doesNotMatch(interactiveDonut, /click to inspect/i);
  assert.match(interactiveDonut, /expenses/);
});


test("donut chart has a premium animated reveal", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(interactiveDonut, /donut-card/);
  assert.match(interactiveDonut, /--slice-index/);
  assert.match(interactiveDonut, /key=\{active\?\.categorySlug \?\? "total"\}/);
  assert.match(styles, /@keyframes donutSpinIn/);
  assert.match(styles, /@keyframes donutCenterPop/);
  assert.match(styles, /\.donut-card \{[\s\S]*animation: donutCardReveal 620ms var\(--ease-out-expo\) both;/);
  assert.match(styles, /\.donut-slice \{[\s\S]*animation: donutSliceSettle 560ms var\(--ease-out-quint\) both;/);
});


test("monthly trend card has an animated timeline reveal", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(dashboardPrimitives, /monthly-trend-card/);
  assert.match(dashboardPrimitives, /--month-index/);
  assert.match(styles, /@keyframes trendCardSweep/);
  assert.match(styles, /@keyframes trendColumnRise/);
  assert.match(styles, /\.monthly-trend-card \{[\s\S]*animation: trendCardSweep 620ms var\(--ease-out-expo\) both;/);
  assert.match(styles, /\.month-col \{[\s\S]*animation: trendColumnRise 520ms var\(--ease-out-quint\) both;/);
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
  assert.match(homePage, /Lifetime spend/);
  assert.match(homePage, /Biggest expense/);
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
