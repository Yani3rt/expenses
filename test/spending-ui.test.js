import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const spendingPage = readFileSync(new URL("../app/spending/page.js", import.meta.url), "utf8");
const monthPicker = readFileSync(new URL("../components/MonthPicker.js", import.meta.url), "utf8");
const categoryDetailCards = readFileSync(new URL("../components/CategoryDetailCards.js", import.meta.url), "utf8");
const categoryComparison = readFileSync(new URL("../components/CategoryComparison.js", import.meta.url), "utf8");
const queries = readFileSync(new URL("../lib/queries.js", import.meta.url), "utf8");
const dashboardPrimitives = readFileSync(new URL("../components/DashboardPrimitives.js", import.meta.url), "utf8");
const globalsCss = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("spending month picker lives in the page header action, not a filter card", () => {
  assert.match(spendingPage, /action=\{<MonthPicker/);
  assert.doesNotMatch(spendingPage, /className="filter-card"/);
  assert.doesNotMatch(spendingPage, />Apply</);
});

test("spending month picker applies immediately on selection", () => {
  assert.match(monthPicker, /"use client"/);
  assert.match(monthPicker, /onChange=\{handleChange\}/);
  assert.match(monthPicker, /router\.push/);
});

test("spending month picker stays accessible without a visible label", () => {
  assert.doesNotMatch(monthPicker, />Month</);
  assert.match(monthPicker, /aria-label="Spending month"/);
});

test("spending page keeps compact route orientation on the smallest mobile breakpoint", () => {
  assert.match(spendingPage, /className="spending-page-header"/);
  assert.match(spendingPage, /titleClassName="spending-mobile-hide"/);
  assert.match(spendingPage, /ledeClassName="spending-mobile-hide"/);
  assert.doesNotMatch(globalsCss, /\.spending-page-header \.spending-mobile-hide \{ display: none; \}/);
});

test("spending page distills the summary row to the two core metrics", () => {
  assert.match(spendingPage, /className="metrics-grid compact-metrics spending-summary-metrics distilled-spending-metrics"/);
  assert.match(spendingPage, /label=\{data\.activeMonth === "all" \? "All-time spend" : "Month spend"\}/);
  assert.match(spendingPage, /data\.comparison\.mode === "comparison"/);
  assert.match(spendingPage, /Change from/);
  assert.match(spendingPage, /label="Average expense"/);
  assert.doesNotMatch(spendingPage, /label="First expense"/);
  assert.doesNotMatch(spendingPage, /label="Latest expense"/);
  assert.match(globalsCss, /\.distilled-spending-metrics \{/);
});

test("spending page renders premium category detail cards in the deleted slot", () => {
  assert.match(spendingPage, /<CategoryDetailCards categories=\{data\.categories\}/);
  assert.match(categoryDetailCards, /Count/);
  assert.match(categoryDetailCards, /Average/);
  assert.match(categoryDetailCards, /Last:/);
  assert.doesNotMatch(categoryDetailCards, /router\.push/);
  assert.doesNotMatch(categoryDetailCards, /featured/);
});

test("category detail cards become a horizontal scroll rail on smaller screens", () => {
  const categoryCss = globalsCss.slice(globalsCss.indexOf(".category-details-shell"));
  assert.match(globalsCss, /@media \(max-width: 1080px\)[\s\S]*\.category-details-grid \{[\s\S]*display: flex;/);
  assert.match(globalsCss, /@media \(max-width: 1080px\)[\s\S]*overflow-x: auto;/);
  assert.match(globalsCss, /@media \(max-width: 1080px\)[\s\S]*-webkit-overflow-scrolling: touch;/);
  assert.doesNotMatch(categoryCss, /category-details-supporting/);
  assert.doesNotMatch(categoryCss, /display: contents;/);
  assert.match(globalsCss, /flex: 0 0 min\(300px, 82vw\);/);
});


test("spending title animates when the month changes", () => {
  assert.match(spendingPage, /animateTitleOnChange/);
  assert.match(spendingPage, /titleAnimationKey=\{data\.activeMonth\}/);
  assert.match(dashboardPrimitives, /title-animates-on-change/);
  assert.match(dashboardPrimitives, /page-title-copy/);
  assert.match(globalsCss, /@keyframes titleSwapIn/);
  assert.match(globalsCss, /\.page-title-copy \{ display: inline-block; animation: titleSwapIn 520ms var\(--ease-out-quart\) both;/);
});


test("spending page explains the month switch more clearly", () => {
  assert.match(spendingPage, /Compare each category with the previous month\./);
  assert.match(spendingPage, /Browse category totals across all recorded spending\./);
  assert.match(spendingPage, /data\.comparison\.mode === "comparison"/);
});

test("spending bars remove redundant average detail", () => {
  assert.match(dashboardPrimitives, /<small>\{category\.expenseCount\} expenses<\/small>/);
  assert.doesNotMatch(dashboardPrimitives, /avg \{money\(category\.averageExpense\)\}/);
});

test("spending query exposes a previous-month category comparison", () => {
  assert.match(queries, /buildSpendingComparison/);
  assert.match(queries, /const previousMonth = activeMonth !== "all" \? shiftMonth\(activeMonth, -1\) : null/);
  assert.match(queries, /previousCategories/);
  assert.match(queries, /previousSummary/);
  assert.match(queries, /comparison,/);
});

test("spending replaces category totals and share with one real comparison", () => {
  assert.match(spendingPage, /<CategoryComparison comparison=\{data\.comparison\} \/>/);
  assert.doesNotMatch(spendingPage, /<CategoryBars/);
  assert.doesNotMatch(spendingPage, /<Donut/);
  assert.match(spendingPage, /<CategoryDetailCards categories=\{data\.categories\}/);
  assert.match(categoryComparison, /Category comparison/);
  assert.match(categoryComparison, /currentTotal/);
  assert.match(categoryComparison, /previousTotal/);
  assert.match(categoryComparison, /deltaAmount/);
  assert.match(categoryComparison, /sharePercent/);
  assert.match(categoryComparison, /\/transactions\?month=/);
});

test("category comparison is full width, uses paired bars, and stacks on mobile", () => {
  assert.match(globalsCss, /\.category-comparison \{/);
  assert.match(globalsCss, /\.category-comparison-row \{[\s\S]*grid-template-columns:/);
  assert.match(globalsCss, /\.comparison-bar-current/);
  assert.match(globalsCss, /\.comparison-bar-previous/);
  assert.match(globalsCss, /\.direction-up \.category-comparison-delta/);
  assert.match(globalsCss, /@media \(max-width: 760px\)[\s\S]*\.category-comparison-row \{[\s\S]*grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\);/);
});

test("retained category cards explain their selected-period details", () => {
  assert.match(spendingPage, /const detailPeriodLabel = data\.activeMonth === "all"/);
  assert.match(spendingPage, /<CategoryDetailCards categories=\{data\.categories\} periodLabel=\{detailPeriodLabel\}/);
  assert.match(categoryDetailCards, /Selected month details/);
  assert.match(categoryDetailCards, /Category activity/);
  assert.match(categoryDetailCards, /Counts, averages, and latest activity for \{periodLabel\}\./);
});
