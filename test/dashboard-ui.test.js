import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const homePage = readFileSync(new URL("../app/page.js", import.meta.url), "utf8");
const dashboardPrimitives = readFileSync(new URL("../components/DashboardPrimitives.js", import.meta.url), "utf8");
const interactiveDonut = readFileSync(new URL("../components/InteractiveDonut.js", import.meta.url), "utf8");
const dailySpendingChart = readFileSync(new URL("../components/DailySpendingChart.js", import.meta.url), "utf8");
const interactiveMonthlyTrend = readFileSync(new URL("../components/InteractiveMonthlyTrend.js", import.meta.url), "utf8");
const queries = readFileSync(new URL("../lib/queries.js", import.meta.url), "utf8");

test("dashboard monthly trend spans the full content width", () => {
  assert.match(homePage, /<MonthlyTrend months=\{data\.monthlyTotals\} className="span-12" \/>/);
});

test("month spend metric renders active-day totals as a decorative background sparkline", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(homePage, /label="Month spend"[\s\S]*sparklineData=\{data\.dailyTotals\}/);
  assert.match(dashboardPrimitives, /function MetricSparkline\(\{ data \}\)/);
  assert.match(dashboardPrimitives, /className="metric-sparkline"/);
  assert.match(dashboardPrimitives, /aria-hidden="true"/);
  assert.match(dashboardPrimitives, /<polyline points=\{linePoints\}/);
  assert.match(styles, /\.metric-sparkline \{[^}]*position: absolute;[^}]*inset:/);
  assert.match(styles, /\.metric > :not\(\.metric-sparkline\) \{ position: relative; z-index: 1; \}/);
});

test("dashboard donut chart selects categories without navigating away", () => {
  assert.match(dashboardPrimitives, /<InteractiveDonut categories=\{categories\} \/>/);
  assert.match(interactiveDonut, /function selectCategory\(row\)/);
  assert.doesNotMatch(interactiveDonut, /useRouter|router\.push|transactions\?category=/);
});

test("dashboard category share keeps percentage context and uses dollar ranking values", () => {
  assert.match(interactiveDonut, /buildCategoryShare/);
  assert.match(interactiveDonut, /useState\(null\)/);
  assert.match(interactiveDonut, />100%<\/strong>/);
  assert.match(interactiveDonut, /sharePercent/);
  assert.match(interactiveDonut, /<strong>\{money\(row\.totalSpend\)\}<\/strong>/);
  assert.match(interactiveDonut, /All categories/);
  assert.match(interactiveDonut, /share-ranking/);
  assert.doesNotMatch(interactiveDonut, /legend-pill/);
});


test("donut chart keeps interaction without decorative reveal motion", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(interactiveDonut, /donut-card/);
  assert.match(interactiveDonut, /key=\{active\?\.categorySlug \?\? "total"\}/);
  assert.doesNotMatch(styles, /\.donut-card \{[^}]*animation:/);
  assert.doesNotMatch(styles, /\.donut-slice \{[^}]*animation:/);
});

test("dashboard share card uses a natural-height sticky ranked layout", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(styles, /\.donut-card \{[^}]*align-self: start;[^}]*position: sticky;[^}]*top:/);
  assert.match(styles, /\.share-chart-stage \{/);
  assert.match(styles, /\.share-ranking \{/);
  assert.match(styles, /\.share-ranking-row \{[\s\S]*grid-template-columns:/);
  assert.match(styles, /\.share-ranking-row \{[^}]*border-radius: 12px;/);
});

test("dashboard share sticky boundary ends before the timeline", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(homePage, /<section className="dashboard-category-row">[\s\S]*title="Recent spending"[\s\S]*<Donut categories=\{data\.categories\} \/>[\s\S]*<\/section>[\s\S]*<MonthlyTrend/);
  assert.match(styles, /\.dashboard-category-row \{[^}]*grid-column: 1 \/ -1;[^}]*display: grid;[^}]*grid-template-columns: repeat\(12, minmax\(0, 1fr\)\);/);
});


test("monthly trend card keeps the data readable without decorative choreography", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(dashboardPrimitives, /<InteractiveMonthlyTrend months=\{months\} className=\{className\} \/>/);
  assert.match(interactiveMonthlyTrend, /monthly-trend-card/);
  assert.match(styles, /\.month-track div \{[^}]*background: var\(--blue\);/);
  assert.doesNotMatch(styles, /\.monthly-trend-card \{[^}]*animation:/);
  assert.doesNotMatch(styles, /\.month-col \{[^}]*animation:/);
});

test("monthly trend shows six desktop, four tablet, and three mobile months before expanding", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(interactiveMonthlyTrend, /Array\.from\(\{ length: 12 \}/);
  assert.match(interactiveMonthlyTrend, /yearMonths\.slice\(0, latestMonthNumber\)\.slice\(-6\)/);
  assert.match(interactiveMonthlyTrend, /has-six-months/);
  assert.match(interactiveMonthlyTrend, /Show more/);
  assert.match(interactiveMonthlyTrend, /Show less/);
  assert.match(interactiveMonthlyTrend, /aria-expanded=\{expanded\}/);
  assert.match(interactiveMonthlyTrend, /monthLabel\(value\)\.replace/);
  assert.match(interactiveMonthlyTrend, /<span>\{monthName\(month\.month\)\}<\/span>/);
  assert.match(interactiveMonthlyTrend, /month\.month === currentMonth \? " is-current"/);
  assert.match(styles, /\.month-col\.is-current span \{ color: var\(--secondary\); font-weight: 800; \}/);
  assert.match(styles, /\.month-bars\.is-expanded \{[^}]*grid-template-columns: repeat\(6, minmax\(0, 1fr\)\);/);
  assert.match(styles, /\.month-bars\.is-expanded \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
  assert.match(styles, /@media \(max-width: 980px\)[\s\S]*\.month-bars\.has-six-months:not\(\.is-expanded\) \.month-col:nth-child\(-n \+ 2\) \{ display: none; \}/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.month-bars\.has-six-months:not\(\.is-expanded\) \.month-col:nth-child\(-n \+ 3\) \{ display: none; \}/);
});


test("dashboard gives daily spending more room beside largest expenses", () => {
  assert.match(homePage, /<DailySpendingChart dailyTotals=\{data\.dailyTotals\} className="span-7" \/>/);
  assert.match(homePage, /<ExpenseList title="Largest expenses" expenses=\{data\.largestExpenses\} compact className="span-5 dashboard-expense-list" showCategory={false} \/>/);
  assert.doesNotMatch(homePage, /title="Recent expenses"/);
  assert.match(dashboardPrimitives, /export function ExpenseList\(\{ title, expenses, compact = false, className = "", showCategory = true \}\)/);
  assert.match(dashboardPrimitives, /className \|\| \(compact \? "span-5" : "span-7"\)/);
});

test("daily spending uses a responsive line chart and scrolls only on smaller screens", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(dailySpendingChart, /Only days with recorded expenses are shown/);
  assert.match(dailySpendingChart, /dailyTotals\.map/);
  assert.match(dailySpendingChart, /Average per spending day/);
  assert.match(dailySpendingChart, /Highest day/);
  assert.match(dailySpendingChart, /daily-line-chart/);
  assert.match(dailySpendingChart, /<polyline className="daily-line-path"/);
  assert.match(dailySpendingChart, /<polygon className="daily-line-area"/);
  assert.match(dailySpendingChart, /<circle cx=\{point\.x\}/);
  assert.match(dailySpendingChart, /scrollBy\(\{ left: direction \* rail\.clientWidth/);
  assert.match(dailySpendingChart, /Show earlier spending days/);
  assert.match(dailySpendingChart, /Show later spending days/);
  assert.match(dailySpendingChart, /Swipe or use arrows/);
  assert.match(styles, /\.daily-line-path \{[^}]*stroke: var\(--blue\);/);
  assert.match(styles, /@media \(max-width: 760px\) \{[\s\S]*\.daily-spending-chart-rail \{[^}]*overflow-x: auto;/);
  assert.match(styles, /\.daily-spending-mobile-controls \{ display: flex;/);
  assert.match(styles, /touch-action: pan-x;/);
  assert.match(styles, /scrollbar-color: var\(--blue\) var\(--surface-low\);/);
});

test("recent spending ledger link matches the category reset control", () => {
  assert.match(dashboardPrimitives, /className="share-reset dashboard-ledger-link"[^>]*>Open ledger<\/Link>/);
});


test("dashboard expense lists stack earlier on tablet for legibility", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(homePage, /dashboard-expense-list/);
  assert.match(styles, /@media \(max-width: 980px\) \{[\s\S]*\.daily-spending-card, \.dashboard-expense-list \{ grid-column: span 12; \}/);
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
