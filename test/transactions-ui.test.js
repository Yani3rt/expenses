import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const transactionsPage = readFileSync(new URL("../app/transactions/page.js", import.meta.url), "utf8");
const transactionsFilters = readFileSync(new URL("../components/TransactionsFilters.js", import.meta.url), "utf8");
const dashboardPrimitives = readFileSync(new URL("../components/DashboardPrimitives.js", import.meta.url), "utf8");

test("transactions page uses instant client filters and active chips", () => {
  assert.match(transactionsPage, /<TransactionsFilters/);
  assert.match(transactionsPage, /<ActiveFilterChips/);
  assert.doesNotMatch(transactionsPage, />Filter</);
});

test("transactions filters include presets, sorting, and debounced search navigation", () => {
  assert.match(transactionsFilters, /export function TransactionsPresets/);
  assert.match(transactionsFilters, /This month/);
  assert.match(transactionsFilters, /Last 3 months/);
  assert.match(transactionsFilters, /Newest first/);
  assert.match(transactionsFilters, /setTimeout/);
  assert.match(transactionsFilters, /router\.replace/);
});

test("expense rows support stronger metadata hierarchy and optional notes", () => {
  assert.match(dashboardPrimitives, /expense-note/);
  assert.match(dashboardPrimitives, /expense-amount/);
});

test("transactions page keeps the compact header without supporting copy", () => {
  assert.match(transactionsPage, /className="transactions-page-header"/);
  assert.match(transactionsPage, /titleClassName="transactions-mobile-hide"/);
  assert.doesNotMatch(transactionsPage, /Still read-only/);
});

test("transactions filters support a sticky mobile search bar with collapsible advanced controls", () => {
  assert.match(transactionsFilters, /sticky-search-bar/);
  assert.match(transactionsFilters, /mobile-filter-toggle/);
  assert.match(transactionsFilters, /transactions-presets-mobile/);
  assert.match(transactionsFilters, /advanced-filters-panel/);
  assert.match(transactionsFilters, /aria-controls="transactions-advanced-filters"/);
  assert.match(transactionsFilters, /className="sr-only"/);
  assert.match(transactionsFilters, /aria-label="Search transactions"/);
});
