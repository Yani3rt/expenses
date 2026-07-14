import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const transactionsPage = readFileSync(new URL("../app/transactions/page.js", import.meta.url), "utf8");
const transactionsFilters = readFileSync(new URL("../components/TransactionsFilters.js", import.meta.url), "utf8");
const dashboardPrimitives = readFileSync(new URL("../components/DashboardPrimitives.js", import.meta.url), "utf8");
const transactionsLedger = readFileSync(new URL("../components/TransactionsLedger.js", import.meta.url), "utf8");
const transactionsApiRoute = readFileSync(new URL("../app/api/transactions/route.js", import.meta.url), "utf8");
const expensesApiRoute = readFileSync(new URL("../app/api/expenses/route.js", import.meta.url), "utf8");
const transactionDetailDialogUrl = new URL("../components/TransactionDetailDialog.js", import.meta.url);
const dialogBehavior = readFileSync(new URL("../lib/dialog-behavior.js", import.meta.url), "utf8");
const globalStyles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("transactions page uses instant client filters and active chips", () => {
  assert.match(transactionsPage, /<TransactionsFilters/);
  assert.match(transactionsPage, /<ActiveFilterChips/);
  assert.match(transactionsPage, /<TransactionsLedger/);
  assert.doesNotMatch(transactionsPage, />Filter</);
});

test("transactions page defaults to this month when no period is supplied", () => {
  assert.match(transactionsPage, /period: params\?\.period \|\| "this_month"/);
});

test("transaction category icons retain their category tone", () => {
  assert.doesNotMatch(globalStyles, /\.expense-row span\s*\{\s*color:\s*var\(--on-variant\)/);
  assert.match(globalStyles, /\.expense-copy > span\s*\{\s*color:\s*var\(--on-variant\)/);
});

test("transactions filters include presets, sorting, and debounced search navigation", () => {
  assert.match(transactionsFilters, /export function TransactionsPresets/);
  assert.match(transactionsFilters, /This month/);
  assert.match(transactionsFilters, /Last 3 months/);
  assert.match(transactionsFilters, /Newest first/);
  assert.match(transactionsFilters, /setTimeout/);
  assert.match(transactionsFilters, /router\.replace/);
  assert.doesNotMatch(transactionsFilters, /aria-label="Date range"/);
  assert.match(transactionsFilters, /params\.delete\("offset"\)/);
  assert.match(transactionsFilters, /\(key !== "period" && value === "all"\)/);
});

test("transactions ledger appends rows and animates new entries", () => {
  assert.match(transactionsLedger, /useEffect/);
  assert.match(transactionsLedger, /setTransactions\(\(current\) => \[\.\.\.current, \.\.\.nextItems\]\)/);
  assert.match(transactionsLedger, /setTransactions\(initialTransactions\)/);
  assert.match(transactionsLedger, /setState\(meta\)/);
  assert.match(transactionsLedger, /setEnteredIds\(newIds\)/);
  assert.match(transactionsLedger, /className=\{enteredLookup\.has\(expense\.id\) \? "row-enter" : ""\}/);
  assert.match(transactionsLedger, /Loading…/);
  assert.doesNotMatch(transactionsLedger, /Number\(value\) === 50/);
  assert.match(transactionsLedger, /<h2>Operations<\/h2>/);
  assert.doesNotMatch(transactionsLedger, /matching transactions<\/h2>/);
  assert.doesNotMatch(transactionsLedger, /<p className="label">Ledger<\/p>/);
});

test("transactions api route exposes paginated ledger data", () => {
  assert.match(transactionsApiRoute, /getTransactionsData/);
  assert.match(transactionsApiRoute, /offset: searchParams\.get\("offset"\)/);
  assert.match(transactionsApiRoute, /limit: searchParams\.get\("limit"\)/);
  assert.match(transactionsApiRoute, /NextResponse\.json/);
});

test("transaction category params remain repeated across page, APIs, and pagination", () => {
  assert.match(transactionsPage, /normalizeCategoryValues\(params\?\.category\)/);
  assert.match(transactionsApiRoute, /searchParams\.getAll\("category"\)/);
  assert.match(expensesApiRoute, /params\.getAll\("category"\)/);
  assert.match(transactionsLedger, /replaceCategoryParams\(params, categories\)/);
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

test("transactions filters disclose advanced controls and count non-default values", () => {
  assert.match(transactionsFilters, /const activeAdvancedFilterCount = \[/);
  assert.match(transactionsFilters, /meta\.month !== "all"/);
  assert.match(transactionsFilters, /meta\.categories\.length > 0/);
  assert.match(transactionsFilters, /meta\.sort !== "newest"/);
  assert.match(transactionsFilters, /desktop-filter-label">More filters/);
  assert.match(transactionsFilters, /mobile-filter-label">Filters/);
  assert.match(transactionsFilters, /activeAdvancedFilterCount > 0/);
  assert.match(transactionsFilters, /aria-expanded=\{isExpanded\}/);
});

test("category filter is an accessible non-native checkbox dropdown", () => {
  assert.match(transactionsFilters, /category-multiselect-trigger/);
  assert.match(transactionsFilters, />All categories</);
  assert.match(transactionsFilters, /role="checkbox"/);
  assert.match(transactionsFilters, /aria-checked=/);
  assert.match(transactionsFilters, /aria-expanded=\{isOpen\}/);
  assert.match(transactionsFilters, /event\.key === "Escape"/);
  assert.match(transactionsFilters, /event\.key === "ArrowDown"/);
  assert.doesNotMatch(transactionsFilters, /<select name="category"/);
});

test("active category chips remove one selected category at a time", () => {
  assert.match(transactionsFilters, /meta\.categories\.map/);
  assert.match(transactionsFilters, /meta\.categories\.filter\(\(value\) => value !== slug\)/);
});

test("active filter chips use the App Router without hard document reloads", () => {
  assert.match(transactionsFilters, /export function ActiveFilterChips[\s\S]*const router = useRouter\(\)/);
  assert.match(transactionsFilters, /export function ActiveFilterChips[\s\S]*const \[, startTransition\] = useTransition\(\)/);
  assert.match(transactionsFilters, /function navigate\(href\)[\s\S]*router\.push\(href\)[\s\S]*router\.refresh\(\)/);
  assert.match(transactionsFilters, /<button[\s\S]*className="filter-chip"[\s\S]*onClick=\{\(\) => navigate\(buildHref\(chip\.next\)\)\}/);
  assert.match(transactionsFilters, /<button[\s\S]*className="clear-filters-link"[\s\S]*onClick=\{\(\) => navigate\("\/transactions"\)\}/);
  assert.doesNotMatch(transactionsFilters, /<a className="filter-chip"/);
  assert.match(globalStyles, /\.filter-chip, \.clear-filters-link\s*\{[^}]*border:\s*0/);
});

test("category options disable zero-match choices while keeping selections removable", () => {
  assert.match(transactionsFilters, /const isUnavailable = category\.expenseCount === 0 && !isSelected/);
  assert.match(transactionsFilters, /disabled=\{isUnavailable\}/);
  assert.match(transactionsFilters, /button\[role="checkbox"\]:not\(:disabled\)/);
  assert.match(globalStyles, /\.category-multiselect-option:disabled/);
});

test("choosing all categories clears the selection and closes the dropdown", () => {
  assert.match(transactionsFilters, /function clearCategories\(\)/);
  assert.match(transactionsFilters, /onChange\(\[\]\)/);
  assert.match(transactionsFilters, /setIsOpen\(false\)/);
  assert.match(transactionsFilters, /onClick=\{clearCategories\}/);
});

test("desktop quick presets stay outside the disclosed select panel", () => {
  const desktopPresetsIndex = transactionsFilters.indexOf('className="transactions-presets-desktop"');
  const advancedPanelIndex = transactionsFilters.indexOf('className={`advanced-filters-panel');
  const mobilePresetsIndex = transactionsFilters.indexOf('className="transactions-presets-mobile"');

  assert.notEqual(desktopPresetsIndex, -1);
  assert.ok(desktopPresetsIndex < advancedPanelIndex);
  assert.ok(mobilePresetsIndex > advancedPanelIndex);
});


test("transactions ledger reserves motion for newly loaded rows", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.doesNotMatch(styles, /\.ledger-card \{[^}]*animation:/);
  assert.doesNotMatch(styles, /\.dense-list \.expense-row \{[^}]*animation:/);
  assert.match(styles, /\.row-enter \{ animation-duration: 520ms; \}/);
});


test("mobile transactions filter stack trims reserved sticky space", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(styles, /@media \(max-width: 1080px\)[\s\S]*\.app-shell \{[\s\S]*align-content: start;[\s\S]*grid-auto-rows: min-content;[\s\S]*\}/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.transactions-filter-shell \{ margin-top: 12px; padding-top: 0; \}/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.sticky-search-bar \{[\s\S]*position: sticky;[\s\S]*top: 80px;[\s\S]*padding: 8px 10px;[\s\S]*gap: 8px;/);
  assert.match(styles, /@media \(max-width: 520px\)[\s\S]*\.transactions-filter-shell \{ padding-top: 0; \}/);
  assert.match(styles, /@media \(max-width: 520px\)[\s\S]*\.expense-row \{[\s\S]*grid-template-columns: 44px minmax\(0, 1fr\) auto;[\s\S]*\}/);
  assert.match(styles, /@media \(max-width: 520px\)[\s\S]*\.expense-row b \{[\s\S]*grid-column: 3;[\s\S]*justify-self: end;[\s\S]*align-self: start;[\s\S]*\}/);
});


test("transactions header copy explains the page purpose", () => {
  assert.match(transactionsPage, /title="Expense ledger"/);
  assert.match(transactionsPage, /Search and narrow down the expenses you need\./);
  assert.doesNotMatch(transactionsPage, /<SummaryMetrics/);
  assert.match(transactionsFilters, /filter-results-summary/);
});

test("transactions filtering avoids transient pending copy and layout shift", () => {
  assert.match(transactionsFilters, /useTransition/);
  assert.match(transactionsFilters, /aria-busy=\{isPending\}/);
  assert.doesNotMatch(transactionsFilters, /Updating results…/);
  assert.match(transactionsFilters, /startTransition/);
  assert.doesNotMatch(transactionsFilters, /filter-pending-status/);
  assert.doesNotMatch(globalStyles, /\.filter-pending-status/);
});

test("transactions pagination preserves rows and offers retry after failure", () => {
  assert.match(transactionsLedger, /fetchTransactionsPage/);
  assert.match(transactionsLedger, /loadError/);
  assert.match(transactionsLedger, /setLoadError/);
  assert.match(transactionsLedger, /Try again/);
  assert.match(transactionsLedger, /clearTimeout/);
});

test("app includes route loading and recoverable database error states", () => {
  const loadingUrl = new URL("../app/loading.js", import.meta.url);
  const errorUrl = new URL("../app/error.js", import.meta.url);
  assert.equal(existsSync(loadingUrl), true);
  assert.equal(existsSync(errorUrl), true);
  const loading = readFileSync(loadingUrl, "utf8");
  const error = readFileSync(errorUrl, "utf8");
  assert.match(loading, /loading-shell/);
  assert.match(error, /"use client"/);
  assert.match(error, /reset\(\)/);
  assert.match(error, /No expense data was changed/);
});

test("ledger rows are semantic buttons that open transaction details", () => {
  assert.match(dashboardPrimitives, /const RowElement = onClick \? "button" : "article"/);
  assert.match(dashboardPrimitives, /type=\{onClick \? "button" : undefined\}/);
  assert.match(transactionsLedger, /onClick=\{\(event\) => openDetail\(expense, event\.currentTarget\)\}/);
  assert.match(transactionsLedger, /<TransactionDetailDialog/);
  assert.match(transactionsLedger, /fetchTransactionDetail/);
  assert.match(transactionsLedger, /return `\/api\/transactions\/\$\{transaction\.id\}`/);
  assert.doesNotMatch(transactionsLedger, /for \(const key of \["q", "period", "month", "category"\]\)/);
});

test("transaction detail dialog exposes category-month cards, chart, and expense list", () => {
  assert.equal(existsSync(transactionDetailDialogUrl), true);
  const dialog = readFileSync(transactionDetailDialogUrl, "utf8");
  assert.match(dialog, /role="dialog"/);
  assert.match(dialog, /aria-modal="true"/);
  assert.match(dialog, /aria-labelledby="transaction-detail-title"/);
  assert.match(dialog, /Loading transaction insights…/);
  assert.match(dialog, /Try again/);
  assert.match(dialog, /Category total/);
  assert.match(dialog, /Transactions/);
  assert.match(dialog, /Average expense/);
  assert.match(dialog, /Change from/);
  assert.match(dialog, /return "New"/);
  assert.match(dialog, /Spending by day/);
  assert.match(dialog, /import \{ BarChart \} from "\.\/dither-kit\/bar-chart"/);
  assert.match(dialog, /import \{ Bar \} from "\.\/dither-kit\/bar"/);
  assert.match(dialog, /import \{ XAxis \} from "\.\/dither-kit\/x-axis"/);
  assert.match(dialog, /import \{ Tooltip \} from "\.\/dither-kit\/tooltip"/);
  assert.match(dialog, /<BarChart[\s\S]*className="category-month-dither"/);
  assert.match(dialog, /<XAxis dataKey="day" \/>/);
  assert.match(dialog, /<Tooltip labelKey="label"/);
  assert.match(dialog, /<Bar isClickable dataKey="totalSpend" variant="dotted" \/>/);
  assert.doesNotMatch(dialog, /<Legend/);
  assert.doesNotMatch(dialog, /<YAxis/);
  assert.match(dialog, /category-month-expenses/);
  assert.match(dialog, /is-selected/);
  assert.match(dialog, /categoryMonth\.dailyTotals\.map/);
  assert.match(dialog, /categoryMonth\.expenses\.map/);
  assert.match(dialog, /aria-label="Close transaction details"/);
  assert.match(dialog, /createDialogBehaviorSession/);
  assert.match(dialogBehavior, /event\.key === "Escape"/);
  assert.match(dialogBehavior, /event\.key !== "Tab"/);
  assert.doesNotMatch(dialog, /Share of filtered spend/);
  assert.doesNotMatch(dialog, /Compared with average/);
  assert.doesNotMatch(dialog, /Category rank/);
  assert.doesNotMatch(dialog, /Share of category spend/);
  assert.doesNotMatch(dialog, /Amount comparison/);
  assert.match(globalStyles, /\.transaction-detail-summary\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(globalStyles, /@keyframes transactionBackdropIn/);
  assert.match(globalStyles, /@keyframes transactionDialogIn/);
  assert.match(globalStyles, /@keyframes transactionInsightIn/);
  assert.match(globalStyles, /@keyframes transactionBarIn/);
  assert.match(globalStyles, /\.transaction-dialog-backdrop\s*\{[^}]*animation:\s*transactionBackdropIn/);
  assert.match(globalStyles, /\.transaction-dialog\s*\{[^}]*animation:\s*transactionDialogIn/);
  assert.match(globalStyles, /\.transaction-detail-summary div\s*\{[^}]*animation:\s*transactionInsightIn/);
  assert.match(globalStyles, /\.category-month-dither\s*\{[^}]*height:\s*180px/);
});

test("interactive hover belongs only to ledger row buttons", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.doesNotMatch(styles, /\.expense-row:hover \{[^}]*transform:/);
  assert.match(styles, /\.ledger-row-button:hover/);
  assert.match(styles, /\.ledger-row-button:focus-visible/);
  assert.doesNotMatch(styles, /\.ledger-card \.ledger-row-button:hover \.pill\s*\{/);
  assert.match(dashboardPrimitives, /"--row-accent": rowAccent/);
  assert.match(styles, /\.ledger-row-button::before/);
  assert.match(styles, /\.dense-list \.ledger-row-button\s*\{[^}]*padding-left:\s*14px/);
  assert.match(styles, /background:\s*var\(--row-accent\)/);
  assert.match(styles, /color-mix\(in srgb, var\(--row-accent\) 6%, transparent\)/);
  assert.match(styles, /\.ledger-row-button:active \.expense-icon/);
  assert.doesNotMatch(styles, /\.ledger-card \.ledger-row-button:hover \.expense-(?:icon|copy|amount)/);
});

test("category-month dither chart and expense list expose useful data", () => {
  const dialog = readFileSync(transactionDetailDialogUrl, "utf8");
  assert.match(dialog, /day: date\.slice\(-2\)/);
  assert.match(dialog, /label: shortDate\(date\)/);
  assert.match(dialog, /valueFormatter=\{\(value\) => money\(value, shownTransaction\.currency\)\}/);
  assert.match(dialog, /aria-current=\{expense\.id === shownTransaction\.id \? "true" : undefined\}/);
});

test("category month chart shows only active days on tablet and mobile", () => {
  const dialog = readFileSync(transactionDetailDialogUrl, "utf8");
  assert.match(dialog, /window\.matchMedia\("\(max-width: 1080px\)"\)/);
  assert.match(dialog, /const activeChartData = fullChartData\.filter\(\(day\) => day\.totalSpend > 0\)/);
  assert.match(dialog, /const chartData = compactChart \? activeChartData : fullChartData/);
});

test("category-month modal uses restrained category-aware color", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const categories = readFileSync(new URL("../lib/categories.js", import.meta.url), "utf8");

  assert.match(categories, /hogar:\s*"primary"/);
  assert.match(styles, /\.transaction-dialog-head \.label\s*\{[^}]*var\(--category-accent\)/);
  assert.match(styles, /\.transaction-detail-summary div\s*\{[^}]*color-mix\(in srgb, var\(--category-accent\) 7%, var\(--surface-lowest\)\)/);
  assert.match(styles, /\.transaction-detail-summary div\s*\{[^}]*border:\s*1px solid color-mix\(in srgb, var\(--category-accent\) 18%, var\(--outline\)\)/);
  assert.match(styles, /\.transaction-dialog-close:hover\s*\{[^}]*var\(--category-accent\)/);
  assert.match(styles, /\.transaction-dialog-close:focus-visible[^}]*outline:\s*2px solid var\(--category-accent\)/);
  assert.match(styles, /\.category-month-expense\.is-selected\s*\{[^}]*border:\s*1px solid color-mix\(in srgb, var\(--category-accent\) 40%, var\(--outline\)\)/);
  assert.doesNotMatch(styles, /\.category-month-expense\.is-selected\s*\{[^}]*box-shadow:\s*inset 3px 0/);
});

test("interactive expense rows keep native button content phrasing-only", () => {
  assert.match(dashboardPrimitives, /<span className=\{`expense-icon/);
  assert.match(dashboardPrimitives, /<span className="expense-copy">/);
  assert.doesNotMatch(dashboardPrimitives, /<div className=\{`expense-icon/);
  assert.doesNotMatch(dashboardPrimitives, /<div className="expense-copy">/);
});
