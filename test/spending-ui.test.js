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
