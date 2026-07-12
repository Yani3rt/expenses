import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const homePage = readFileSync(new URL("../app/page.js", import.meta.url), "utf8");
const dashboardPrimitives = readFileSync(new URL("../components/DashboardPrimitives.js", import.meta.url), "utf8");
const interactiveDonut = readFileSync(new URL("../components/InteractiveDonut.js", import.meta.url), "utf8");
const dailySpendingChart = readFileSync(new URL("../components/DailySpendingChart.js", import.meta.url), "utf8");
const interactiveMonthlyTrend = readFileSync(new URL("../components/InteractiveMonthlyTrend.js", import.meta.url), "utf8");
const interactiveLargestExpenses = readFileSync(new URL("../components/InteractiveLargestExpenses.js", import.meta.url), "utf8");
const rangeTabs = readFileSync(new URL("../components/RangeTabs.js", import.meta.url), "utf8");
const ditheredSpendingCharts = readFileSync(new URL("../components/DitheredSpendingCharts.js", import.meta.url), "utf8");
const ditherChartContext = readFileSync(new URL("../components/dither-kit/chart-context.jsx", import.meta.url), "utf8");
const ditherTooltip = readFileSync(new URL("../components/dither-kit/tooltip.jsx", import.meta.url), "utf8");
const ditherCartesianRoot = readFileSync(new URL("../components/dither-kit/cartesian-root.jsx", import.meta.url), "utf8");
const animatedText = readFileSync(new URL("../components/AnimatedText.js", import.meta.url), "utf8");
const queries = readFileSync(new URL("../lib/queries.js", import.meta.url), "utf8");
const nextConfig = readFileSync(new URL("../next.config.mjs", import.meta.url), "utf8");

test("development server accepts the local loopback hosts used by the app", () => {
  assert.match(nextConfig, /allowedDevOrigins:\s*\[[^\]]*"localhost"[^\]]*"127\.0\.0\.1"[^\]]*\]/);
});

test("dashboard monthly trend spans the full content width", () => {
  assert.match(homePage, /<MonthlyTrend months=\{data\.monthlyTotals\} className="span-12" \/>/);
});

test("dashboard adds three dithered area views after the existing charts", () => {
  assert.match(homePage, /<DitheredSpendingCharts[\s\S]*monthlyTotals=\{data\.monthlyTotals\}[\s\S]*dailyTotals=\{data\.dailyTotals\}[\s\S]*previousDailyTotals=\{data\.previousDailyTotals\}/);
  assert.match(ditheredSpendingCharts, /Cumulative daily spend/);
  assert.match(ditheredSpendingCharts, /Monthly spending history/);
  assert.match(ditheredSpendingCharts, /Daily spending/);
  assert.equal((ditheredSpendingCharts.match(/<AreaChart/g) || []).length, 2);
  assert.equal((ditheredSpendingCharts.match(/<BarChart/g) || []).length, 1);
  assert.match(ditheredSpendingCharts, /<Bar isClickable dataKey="totalSpend" variant="dotted" \/>/);
  assert.match(ditheredSpendingCharts, /<BarChart[\s\S]*?<XAxis dataKey="label" \/>[\s\S]*?<Legend isClickable \/>/);
  assert.doesNotMatch(ditheredSpendingCharts, /<BarChart[\s\S]*?<YAxis[\s\S]*?<\/BarChart>/);
  assert.match(ditheredSpendingCharts, /bloom="aura"/);
  assert.match(ditheredSpendingCharts, /variant="gradient"/);
  assert.match(ditheredSpendingCharts, /function ChartCard/);
  assert.match(ditheredSpendingCharts, /<article ref=\{cardRef\} className="card span-12 dither-chart-card"/);
  assert.equal((ditheredSpendingCharts.match(/<ChartCard/g) || []).length, 3);
  assert.doesNotMatch(ditheredSpendingCharts, /dither-chart-grid|Spending, three ways/);
  assert.match(ditheredSpendingCharts, /new IntersectionObserver/);
  assert.match(ditheredSpendingCharts, /threshold: 0\.25/);
  assert.match(ditheredSpendingCharts, /replayToken/);
  assert.match(ditheredSpendingCharts, /animationDuration: 1000/);
  assert.match(ditheredSpendingCharts, /key: hasEntered \? id : `\$\{id\}-idle`/);
});

test("cumulative dither tooltip hides series labels while retaining values", () => {
  assert.match(ditheredSpendingCharts, /<Tooltip labelKey="day" hideSeriesLabels valueFormatter=/);
  assert.match(ditherTooltip, /hideSeriesLabels = false/);
  assert.match(ditherTooltip, /\{!hideSeriesLabels && <span className="text-muted-foreground">\{item\.label\}<\/span>\}/);
  assert.match(ditherTooltip, /className=\{cn\("text-foreground", !hideSeriesLabels && "ml-auto pl-2"\)\}/);
  assert.match(ditherTooltip, /hideSeriesLabels && "dither-tooltip-compact"/);
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(styles, /\.dither-chart-stage > div > div\.dither-tooltip-compact \{ min-width: 0 !important; width: max-content !important; \}/);
});

test("dithered daily spending switches between week and month", () => {
  assert.match(ditheredSpendingCharts, /import RangeTabs from "@\/components\/RangeTabs"/);
  assert.match(ditheredSpendingCharts, /const \[dailyRange, setDailyRange\] = useState\("month"\)/);
  assert.match(ditheredSpendingCharts, /dailyRange === "week"[\s\S]*weekBounds\.start[\s\S]*weekBounds\.end/);
  assert.match(ditheredSpendingCharts, /<RangeTabs[\s\S]*value=\{dailyRange\}[\s\S]*onChange=\{setDailyRange\}[\s\S]*className="spending-range-tabs"/);
  assert.match(ditheredSpendingCharts, /data=\{visibleDailyData\}/);
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.dither-chart-card \.section-head \{ flex-direction: row; align-items: flex-start; \}/);
  assert.match(ditheredSpendingCharts, /<AreaChart data=\{visibleDailyData\}[^>]*tapToPinTooltip/);
  assert.equal((ditheredSpendingCharts.match(/tapToPinTooltip/g) || []).length, 3);
  assert.match(ditherCartesianRoot, /tapToPinTooltip = false/);
  assert.match(ditherCartesianRoot, /const \[pinnedIndex, setPinnedIndex\] = useState\(null\)/);
  assert.match(ditherCartesianRoot, /onPointerDown=\{tapToPinTooltip \? pinTooltip : undefined\}/);
  assert.match(ditherCartesianRoot, /pinnedIndex == null[\s\S]*ctx\.setHoverIndex\(null\)/);
});

test("dither chart series registration callbacks stay stable between renders", () => {
  assert.match(ditherChartContext, /import \{ createContext, use, useCallback, useState \} from "react"/);
  assert.match(ditherChartContext, /const registerSeries = useCallback\(\(spec\) => \{/);
  assert.match(ditherChartContext, /const unregisterSeries = useCallback\(\(dataKey\) => \{/);
});

test("dither charts retain their measured stage when Tailwind utilities are unavailable", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(styles, /\.dither-chart-stage > div \{ position: relative; width: 100%; height: 100%; \}/);
  assert.match(styles, /\.dither-chart-stage canvas,[\s\S]*\.dither-chart-stage svg \{ position: absolute;/);
  assert.match(styles, /\.dither-chart-stage svg text \{ font-size: 11px; \}/);
  assert.equal((ditheredSpendingCharts.match(/margins=\{\{[^}]*left: 68/g) || []).length, 2);
  assert.match(ditheredSpendingCharts, /<BarChart[^>]*margins=\{\{ top: 42, left: 16 \}\}/);
  assert.match(styles, /\.dither-chart-stage > div > div:not\(:has\(> button\)\) \{[^}]*background: var\(--surface-lowest\);[^}]*border: 1px solid var\(--outline\);[^}]*box-shadow: var\(--shadow\);/);
});

test("page headers animate their large title by default on every route", () => {
  assert.match(dashboardPrimitives, /animateTitleOnChange = true/);
  assert.match(dashboardPrimitives, /<span className="page-title-copy" key=\{titleAnimationKey \?\? title\}>\{title\}<\/span>/);
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

test("dashboard donut ring provides the same simple click animation", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(interactiveDonut, /const \[playfulSlug, setPlayfulSlug\] = useState\(null\)/);
  assert.match(interactiveDonut, /onClick=\{\(\) => playCategory\(slice\)\}/);
  assert.match(interactiveDonut, /onClick=\{\(\) => playCategory\(row\)\}/);
  assert.match(interactiveDonut, /onAnimationEnd=\{\(\) => setPlayfulSlug\(null\)\}/);
  assert.match(styles, /\.donut\.is-playful \{ animation: donut-ring-play 420ms/);
  assert.match(styles, /@keyframes donut-ring-play/);
});

test("dashboard actions use a quick arrow and press response", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(dashboardPrimitives, /className="change-summary-action dashboard-delight-action"/);
  assert.match(dashboardPrimitives, /className="share-reset dashboard-ledger-link dashboard-delight-action"/);
  assert.equal((dashboardPrimitives.match(/className="dashboard-action-arrow" aria-hidden="true">→<\/span>/g) || []).length, 2);
  assert.match(styles, /\.dashboard-delight-action \{[^}]*transition: transform \.18s/);
  assert.match(styles, /\.dashboard-delight-action:hover \.dashboard-action-arrow[^}]*translateX\(3px\)/);
  assert.match(styles, /\.dashboard-delight-action:active \{[^}]*scale\(\.98\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*transition-duration: 0\.01ms !important;/);
});

test("dashboard change summary headline reflects the comparison state", () => {
  assert.match(dashboardPrimitives, /function comparisonHeadline\(comparison\)/);
  assert.match(dashboardPrimitives, /comparison\.direction === "down"[\s\S]*"A lighter month"/);
  assert.match(dashboardPrimitives, /comparison\.direction === "up"[\s\S]*"Spending picked up"/);
  assert.match(dashboardPrimitives, /comparison\.direction === "flat"[\s\S]*"Holding steady\."/);
  assert.match(dashboardPrimitives, /<h2 id="change-summary-title">\{comparisonHeadline\(comparison\)\}<\/h2>/);
  assert.doesNotMatch(dashboardPrimitives, />The month in one sentence<\/h2>/);
  assert.doesNotMatch(dashboardPrimitives, /<p className="label">What changed<\/p>/);
});

test("dashboard comparison sentence uses warm household-friendly language", () => {
  assert.match(dashboardPrimitives, /You spent <ChangeSignal direction=\{comparison\.direction\}>/);
  assert.match(dashboardPrimitives, /\{directionWord\} than in \{previousLabel\}/);
  assert.match(dashboardPrimitives, /made the biggest difference, down/);
  assert.match(dashboardPrimitives, /led the increase at/);
  assert.match(dashboardPrimitives, /helped offset that, down/);
  assert.match(dashboardPrimitives, /You landed <ChangeSignal direction="flat">about the same<\/ChangeSignal> as you did in/);
  assert.match(dashboardPrimitives, /gives you a fresh starting point/);
});

test("dashboard comparison uses semantic color and arrows without relying on color alone", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(dashboardPrimitives, /function ChangeSignal\(\{ direction, children \}\)/);
  assert.match(dashboardPrimitives, /direction === "down" \? "↓" : direction === "up" \? "↑" : "→"/);
  assert.match(dashboardPrimitives, /className=\{`change-signal is-\$\{direction\}`\}/);
  assert.match(dashboardPrimitives, /className="change-signal-arrow" aria-hidden="true"/);
  assert.match(styles, /\.change-signal \{[^}]*display: inline-flex;[^}]*white-space: nowrap;/);
  assert.match(styles, /\.change-signal\.is-down \{[^}]*color: var\(--secondary\);/);
  assert.match(styles, /\.change-signal\.is-up \{[^}]*color: #b54708;/);
  assert.match(styles, /\.change-signal\.is-flat \{[^}]*color: var\(--primary\);/);
});

test("dashboard category share keeps percentage context and uses dollar ranking values", () => {
  assert.match(interactiveDonut, /buildCategoryShare/);
  assert.match(interactiveDonut, /useState\(null\)/);
  assert.match(interactiveDonut, /<AnimatedText as="strong">100%<\/AnimatedText>/);
  assert.match(interactiveDonut, /sharePercent/);
  assert.match(interactiveDonut, /<strong>\{money\(row\.totalSpend\)\}<\/strong>/);
  assert.match(interactiveDonut, /All categories/);
  assert.match(interactiveDonut, /share-ranking/);
  assert.doesNotMatch(interactiveDonut, /legend-pill/);
});

test("donut center values animate character-by-character while category labels stay still", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(interactiveDonut, /import AnimatedText/);
  assert.match(animatedText, /className="donut-center-character"/);
  assert.match(animatedText, /"--character-index": staggerOffset \+ index/);
  assert.match(interactiveDonut, /key=\{active\?\.categorySlug \?\? "total"\}/);
  assert.match(interactiveDonut, /<span>\{active\.category\}<\/span>/);
  assert.match(interactiveDonut, /<span>Total spending<\/span>/);
  assert.doesNotMatch(interactiveDonut, /<AnimatedText as="span"/);
  assert.match(styles, /\.donut-center-character \{[^}]*animation: donut-center-character-in/);
  assert.match(styles, /@keyframes donut-center-character-in/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.donut-center-character \{ animation: none; \}/);
});

test("dashboard summary values use the category-share character animation on show", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(dashboardPrimitives, /animateValue = false/);
  assert.match(dashboardPrimitives, /animateValue \? <AnimatedText as="strong">\{value\}<\/AnimatedText>/);
  assert.equal((homePage.match(/animateValue/g) || []).length, 3);
  assert.match(styles, /\.metric strong \.donut-center-character \{ color: inherit; \}/);
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

test("monthly trend circles provide a simple replayable click animation", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(interactiveMonthlyTrend, /const \[playfulMonth, setPlayfulMonth\] = useState\(null\)/);
  assert.match(interactiveMonthlyTrend, /type="button"/);
  assert.match(interactiveMonthlyTrend, /onClick=\{\(\) => setPlayfulMonth\(month\.month\)\}/);
  assert.match(interactiveMonthlyTrend, /onAnimationEnd=\{\(\) => setPlayfulMonth\(null\)\}/);
  assert.match(styles, /\.month-col\.is-playful \.month-track \{ animation: month-circle-play/);
  assert.match(styles, /@keyframes month-circle-play/);
  assert.doesNotMatch(styles, /\.month-col\.is-playful[^\n]*::before/);
});


test("dashboard gives daily spending more room beside largest expenses", () => {
  assert.match(homePage, /<DailySpendingChart dailyTotals=\{data\.dailyTotals\} className="span-7" \/>/);
  assert.match(homePage, /<InteractiveLargestExpenses expensesByRange=\{data\.largestExpensesByRange\} className="span-5 dashboard-expense-list" \/>/);
  assert.doesNotMatch(homePage, /title="Recent expenses"/);
  assert.match(dashboardPrimitives, /export function ExpenseList\(\{ title, expenses, compact = false, className = "", showCategory = true \}\)/);
  assert.match(dashboardPrimitives, /className \|\| \(compact \? "span-5" : "span-7"\)/);
});

test("daily spending uses a responsive line chart and scrolls only on smaller screens", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(dailySpendingChart, /Only days with recorded expenses this \{range\} are shown/);
  assert.match(dailySpendingChart, /visibleTotals\.map/);
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
  assert.match(dailySpendingChart, /const hasScrollableDays = visibleTotals\.length > 8/);
  assert.match(dailySpendingChart, /daily-spending-card\$\{hasScrollableDays \? " has-scrollable-days" : ""\}/);
  assert.match(styles, /\.daily-spending-card\.has-scrollable-days \.daily-spending-mobile-controls \{ display: flex;/);
  assert.match(styles, /\.daily-spending-card\.has-scrollable-days \.daily-spending-chart-rail \{[^}]*overflow-x: auto;/);
  assert.match(styles, /\.daily-spending-card\.has-scrollable-days \.daily-line-chart \{ width: var\(--daily-line-width\); min-width: var\(--daily-line-width\); \}/);
});

test("daily spending switches between the current week and month", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(dailySpendingChart, /const \[range, setRange\] = useState\("month"\)/);
  assert.match(dailySpendingChart, /currentWeekBounds\(today\)/);
  assert.match(dailySpendingChart, /day\.date >= weekBounds\.start && day\.date <= weekBounds\.end/);
  assert.match(dailySpendingChart, /<RangeTabs[\s\S]*options=\{DAILY_RANGE_OPTIONS\}[\s\S]*value=\{range\}[\s\S]*onChange=\{setRange\}/);
  assert.match(rangeTabs, /role="tablist"/);
  assert.match(rangeTabs, /role="tab"/);
  assert.match(rangeTabs, /aria-selected=\{option\.value === value\}/);
  assert.match(dailySpendingChart, /No spending this \{range\}/);
  assert.match(styles, /\.range-tabs \{[^}]*position: relative;[^}]*display: grid;/);
  assert.match(styles, /\.range-tabs\.index-1 \.range-tabs-pill \{[^}]*translateX\(calc\(100% \+ 2px\)\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.range-tabs-pill,[\s\S]*transition: none !important;/);
});

test("largest expenses switches between week, month, and year with month as default", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(interactiveLargestExpenses, /const \[range, setRange\] = useState\("month"\)/);
  assert.match(interactiveLargestExpenses, /\{ value: "week", label: "Week" \}/);
  assert.match(interactiveLargestExpenses, /\{ value: "month", label: "Month" \}/);
  assert.match(interactiveLargestExpenses, /\{ value: "year", label: "Year" \}/);
  assert.match(interactiveLargestExpenses, /const expenses = expensesByRange\[range\] \|\| \[\]/);
  assert.match(interactiveLargestExpenses, /<RangeTabs[\s\S]*value=\{range\}[\s\S]*onChange=\{setRange\}/);
  assert.match(interactiveLargestExpenses, /No expenses this \{range\}/);
  assert.match(styles, /\.range-tabs\.count-3 \.range-tabs-pill \{[^}]*width: calc\(\(100% - 10px\) \/ 3\);/);
  assert.match(styles, /\.range-tabs\.index-2 \.range-tabs-pill \{[^}]*translateX\(calc\(200% \+ 4px\)\)/);
});

test("daily spending chart animates once when it enters the viewport", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(dailySpendingChart, /const chartRef = useRef\(null\)/);
  assert.match(dailySpendingChart, /new IntersectionObserver/);
  assert.match(dailySpendingChart, /chart\.classList\.add\("is-in-view"\)/);
  assert.match(dailySpendingChart, /observer\.unobserve\(chart\)/);
  assert.match(dailySpendingChart, /pathLength="1"/);
  assert.match(styles, /\.daily-line-chart\.is-in-view \.daily-line-path \{ animation: daily-line-draw 900ms/);
  assert.match(styles, /\.daily-line-chart\.is-in-view \.daily-line-area \{ animation: daily-area-reveal 700ms/);
  assert.match(styles, /@keyframes daily-point-pop/);
});

test("recent spending ledger link matches the category reset control", () => {
  assert.match(dashboardPrimitives, /className="share-reset dashboard-ledger-link dashboard-delight-action"/);
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
