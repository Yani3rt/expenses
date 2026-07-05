import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const spendingPage = readFileSync(new URL("../app/spending/page.js", import.meta.url), "utf8");
const monthPicker = readFileSync(new URL("../components/MonthPicker.js", import.meta.url), "utf8");
const categoryDetailCards = readFileSync(new URL("../components/CategoryDetailCards.js", import.meta.url), "utf8");
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

test("spending page hides title and supporting copy on the smallest mobile breakpoint", () => {
  assert.match(spendingPage, /className="spending-page-header"/);
  assert.match(spendingPage, /titleClassName="spending-mobile-hide"/);
  assert.match(spendingPage, /ledeClassName="spending-mobile-hide"/);
});

test("spending page renders premium category detail cards in the deleted slot", () => {
  assert.match(spendingPage, /<CategoryDetailCards categories=\{data\.categories\} \/>/);
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
  assert.match(globalsCss, /\.page-title-copy \{ display: inline-block; animation: titleSwapIn 360ms var\(--ease-out-quint\) both;/);
});
