import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const spendingPage = readFileSync(new URL("../app/spending/page.js", import.meta.url), "utf8");
const monthPicker = readFileSync(new URL("../components/MonthPicker.js", import.meta.url), "utf8");

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
