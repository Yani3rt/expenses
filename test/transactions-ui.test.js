import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const transactionsPage = readFileSync(new URL("../app/transactions/page.js", import.meta.url), "utf8");
const transactionsFilters = readFileSync(new URL("../components/TransactionsFilters.js", import.meta.url), "utf8");
const dashboardPrimitives = readFileSync(new URL("../components/DashboardPrimitives.js", import.meta.url), "utf8");
const transactionsLedger = readFileSync(new URL("../components/TransactionsLedger.js", import.meta.url), "utf8");
const transactionsApiRoute = readFileSync(new URL("../app/api/transactions/route.js", import.meta.url), "utf8");
const transactionDetailDialogUrl = new URL("../components/TransactionDetailDialog.js", import.meta.url);
const dialogBehavior = readFileSync(new URL("../lib/dialog-behavior.js", import.meta.url), "utf8");

test("transactions page uses instant client filters and active chips", () => {
  assert.match(transactionsPage, /<TransactionsFilters/);
  assert.match(transactionsPage, /<ActiveFilterChips/);
  assert.match(transactionsPage, /<TransactionsLedger/);
  assert.doesNotMatch(transactionsPage, />Filter</);
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
});

test("transactions api route exposes paginated ledger data", () => {
  assert.match(transactionsApiRoute, /getTransactionsData/);
  assert.match(transactionsApiRoute, /offset: searchParams\.get\("offset"\)/);
  assert.match(transactionsApiRoute, /limit: searchParams\.get\("limit"\)/);
  assert.match(transactionsApiRoute, /NextResponse\.json/);
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
  assert.match(transactionsFilters, /meta\.category !== "all"/);
  assert.match(transactionsFilters, /meta\.sort !== "newest"/);
  assert.match(transactionsFilters, /desktop-filter-label">More filters/);
  assert.match(transactionsFilters, /mobile-filter-label">Filters/);
  assert.match(transactionsFilters, /activeAdvancedFilterCount > 0/);
  assert.match(transactionsFilters, /aria-expanded=\{isExpanded\}/);
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

test("transactions filtering exposes a visible pending state", () => {
  assert.match(transactionsFilters, /useTransition/);
  assert.match(transactionsFilters, /aria-busy=\{isPending\}/);
  assert.match(transactionsFilters, /Updating results…/);
  assert.match(transactionsFilters, /startTransition/);
  assert.match(transactionsFilters, /\{isPending \? \([\s\S]*filter-pending-status[\s\S]*\) : null\}/);
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
});

test("transaction detail dialog exposes accessible states, controls, and comparison semantics", () => {
  assert.equal(existsSync(transactionDetailDialogUrl), true);
  const dialog = readFileSync(transactionDetailDialogUrl, "utf8");
  assert.match(dialog, /role="dialog"/);
  assert.match(dialog, /aria-modal="true"/);
  assert.match(dialog, /aria-labelledby="transaction-detail-title"/);
  assert.match(dialog, /Loading transaction insights…/);
  assert.match(dialog, /Try again/);
  assert.match(dialog, /Overall rank/);
  assert.match(dialog, /Share of filtered spend/);
  assert.match(dialog, /Compared with average/);
  assert.match(dialog, /aria-label="Amount comparison"/);
  assert.match(dialog, /Transaction amount/);
  assert.match(dialog, /Filtered average/);
  assert.match(dialog, /Category average/);
  assert.match(dialog, /aria-label="Close transaction details"/);
  assert.match(dialog, /installDialogBehavior/);
  assert.match(dialogBehavior, /event\.key === "Escape"/);
  assert.match(dialogBehavior, /event\.key !== "Tab"/);
  assert.match(dialog, /Category rank/);
  assert.match(dialog, /Share of category spend/);
});

test("interactive hover belongs only to ledger row buttons", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.doesNotMatch(styles, /\.expense-row:hover \{[^}]*transform:/);
  assert.match(styles, /\.ledger-row-button:hover/);
  assert.match(styles, /\.ledger-row-button:focus-visible/);
});

test("comparison values are exposed as a semantic list while visual tracks stay decorative", () => {
  const dialog = readFileSync(transactionDetailDialogUrl, "utf8");
  assert.match(dialog, /<ul className="transaction-comparison" aria-label="Amount comparison">/);
  assert.match(dialog, /<li className="transaction-comparison-row"/);
  assert.match(dialog, /<span>\{label\}<\/span><strong>\{formattedValue\}<\/strong>/);
  assert.match(dialog, /className="transaction-comparison-track" aria-hidden="true"/);
  assert.doesNotMatch(dialog, /role="img"/);
});

test("interactive expense rows keep native button content phrasing-only", () => {
  assert.match(dashboardPrimitives, /<span className=\{`expense-icon/);
  assert.match(dashboardPrimitives, /<span className="expense-copy">/);
  assert.doesNotMatch(dashboardPrimitives, /<div className=\{`expense-icon/);
  assert.doesNotMatch(dashboardPrimitives, /<div className="expense-copy">/);
});
