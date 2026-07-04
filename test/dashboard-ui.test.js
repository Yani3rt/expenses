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
