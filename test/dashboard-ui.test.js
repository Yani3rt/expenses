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
