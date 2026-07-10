# Expense Viewer Top-Three Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dashboard explain month-over-month change, align the interface with the household product strategy, and add recoverable loading/error states.

**Architecture:** Add a pure comparison module that receives query rows and returns a stable dashboard DTO. Keep database access read-only and extend the existing dashboard query with explicitly scoped previous-month/category data. Add small client-state helpers for transaction pagination, then consume them from existing components while route-level Next.js files handle initial loading and database failures.

**Tech Stack:** Next.js 16 App Router, React 19, Node `node:test`, Node SQLite `DatabaseSync`, plain CSS.

## Global Constraints

- Use `pnpm` for project commands.
- Add no production dependency without explicit confirmation.
- Never write to, migrate, repair, replace, chmod, chown, or otherwise mutate the canonical expense database.
- Open SQLite through the existing read-only `DatabaseSync` path and keep `PRAGMA query_only = ON`.
- Keep comparison copy deterministic; do not call an AI service.
- No formal accessibility program is in scope, but preserve inexpensive semantic and reduced-motion safeguards.

---

### Task 1: Month-over-month comparison domain logic

**Files:**
- Create: `lib/dashboard-comparison.js`
- Create: `test/dashboard-comparison.test.js`

**Interfaces:**
- Produces: `buildDashboardComparison({ currentMonth, previousMonth, currentTotal, previousTotal, categoryRows })`
- Produces: `{ currentMonth, previousMonth, currentTotal, previousTotal, deltaAmount, deltaPercent, direction, primaryDriver, offsetDriver }`

- [ ] **Step 1: Write failing unit tests**

Cover increase/decrease/flat values, `deltaPercent: null` when previous spending is zero, categories missing from one month, largest positive driver, and largest negative offset.

```js
test("builds an increasing monthly comparison with drivers", () => {
  const comparison = buildDashboardComparison({
    currentMonth: "2026-06",
    previousMonth: "2026-05",
    currentTotal: 4200,
    previousTotal: 3780,
    categoryRows: [
      { category: "Food", categorySlug: "comida", currentTotal: 900, previousTotal: 610 },
      { category: "Transport", categorySlug: "transporte", currentTotal: 120, previousTotal: 200 },
    ],
  });
  assert.equal(comparison.direction, "up");
  assert.equal(comparison.deltaAmount, 420);
  assert.equal(comparison.primaryDriver.deltaAmount, 290);
  assert.equal(comparison.offsetDriver.deltaAmount, -80);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test test/dashboard-comparison.test.js`

Expected: failure because `lib/dashboard-comparison.js` does not exist.

- [ ] **Step 3: Implement the pure comparison helper**

Normalize numeric inputs, round money to two decimals, compute percentage only when `previousTotal > 0`, and derive drivers from signed category deltas.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test test/dashboard-comparison.test.js`

Expected: all comparison tests pass.

---

### Task 2: Period-explicit dashboard query and presentation

**Files:**
- Modify: `lib/queries.js:296-360`
- Modify: `components/DashboardPrimitives.js`
- Modify: `app/page.js`
- Modify: `test/dashboard-ui.test.js`
- Modify: `test/queries.test.js`

**Interfaces:**
- Consumes: `buildDashboardComparison(...)` from Task 1.
- Produces: `data.comparison` and `data.largestExpense` scoped to `data.month.activeMonth`.
- Produces: `ChangeSummary({ comparison })`.

- [ ] **Step 1: Write failing source/query contract tests**

Assert that the dashboard renders `ChangeSummary`, labels the comparison metric, removes `Lifetime spend`, and scopes the largest-expense SQL with `activeMonth`. Add a query contract assertion that `data.comparison` exists when DB-backed tests can run.

- [ ] **Step 2: Run dashboard UI tests and verify RED**

Run: `node --test test/dashboard-ui.test.js`

Expected: comparison assertions fail against the old dashboard.

- [ ] **Step 3: Extend the read-only dashboard query**

Use the existing `shiftMonth()` helper to derive the previous month. Query the previous total and category totals for both months on the existing dashboard connection. Add `WHERE substr(e.expense_date, 1, 7) = :activeMonth` to the largest-expense query. Pass normalized rows into `buildDashboardComparison()`.

- [ ] **Step 4: Add `ChangeSummary` and replace mixed-scope metrics**

Render three latest-month metrics: month spend, change from previous month, and largest expense this month. Add deterministic narrative branches for up/down/flat/no-comparison data and a Transactions link.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `node --test test/dashboard-comparison.test.js test/dashboard-ui.test.js`

Expected: all DB-independent dashboard tests pass.

---

### Task 3: Reconcile and quiet the visual system

**Files:**
- Modify: `DESIGN.md`
- Modify: `app/globals.css`
- Create: `test/visual-system.test.js`
- Modify: `test/responsive-ui.test.js`

**Interfaces:**
- Produces: `.change-summary`, `.change-summary-copy`, and `.change-summary-action` styles.
- Preserves: existing class names consumed by pages/components unless explicitly replaced in Task 2.

- [ ] **Step 1: Write failing visual-system assertions**

Assert a restrained shadow token, card radius at or below 16px, no generic `.card:hover` lift, no universal `.page-header`/`.content-grid > .card` entrance declarations, no looping donut/trend glow, and no mobile rule that hides Spending/Transactions titles.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test test/visual-system.test.js test/responsive-ui.test.js`

Expected: the old 24–28px radii, wide shadows, hover lift, and entrance choreography fail.

- [ ] **Step 3: Update DESIGN.md**

Replace professional/glassmorphism language with the household product direction. Document restrained surfaces, 14–16px content radii, category color as data, functional motion only, and one-family-first product typography.

- [ ] **Step 4: Apply the quieter CSS system**

Reduce the global shadow, normalize content radii, remove static hover lift and decorative gradients/glows, remove universal entrance animation assignments, keep functional control transitions, and retain compact mobile route headings.

- [ ] **Step 5: Add restrained ChangeSummary styling**

Use a simple bordered region rather than another floating card. Keep the narrative and action readable at desktop and stacked on mobile.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `node --test test/visual-system.test.js test/responsive-ui.test.js test/dashboard-ui.test.js`

Expected: visual-system and responsive source contracts pass.

---

### Task 4: Recoverable filtering, pagination, and route states

**Files:**
- Create: `lib/transactions-client.js`
- Create: `test/transactions-client.test.js`
- Create: `app/loading.js`
- Create: `app/error.js`
- Modify: `components/TransactionsFilters.js`
- Modify: `components/TransactionsLedger.js`
- Modify: `test/transactions-ui.test.js`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `fetchTransactionsPage(url, fetchImpl = fetch)` returning `{ transactions, meta, summary }` or throwing a user-safe `Error`.
- `TransactionsFilters` exposes `aria-busy` and visible pending copy.
- `TransactionsLedger` exposes inline `.ledger-error` and retries the same request.

- [ ] **Step 1: Write failing pagination helper tests**

Test a valid payload, non-OK response, and malformed payload using injected `fetchImpl` functions.

```js
await assert.rejects(
  () => fetchTransactionsPage("/api/transactions", async () => ({ ok: false, status: 503 })),
  /temporarily unavailable/i,
);
```

- [ ] **Step 2: Run helper tests and verify RED**

Run: `node --test test/transactions-client.test.js`

Expected: module-not-found failure.

- [ ] **Step 3: Implement the minimal pagination helper and verify GREEN**

Validate `response.ok`, parse JSON, require `transactions` to be an array and `meta` to be an object, then return the normalized payload.

- [ ] **Step 4: Write failing UI source assertions**

Assert `useTransition` and pending copy in filters, error/retry state and helper usage in the ledger, and the presence of route `loading.js`/`error.js` with `reset()`.

- [ ] **Step 5: Run transaction UI tests and verify RED**

Run: `node --test test/transactions-ui.test.js`

Expected: new pending/error/retry assertions fail.

- [ ] **Step 6: Implement client and route states**

Wrap filter navigation in `startTransition`, retain existing results, add visible status, use `fetchTransactionsPage()` from the ledger, preserve loaded rows on failure, add Retry, and clear the row animation timeout during cleanup. Add route loading and error components.

- [ ] **Step 7: Add restrained loading/error CSS**

Use static placeholders with a subtle opacity pulse only when reduced motion permits. Keep errors inline and calm; do not introduce another elevated card style.

- [ ] **Step 8: Run focused tests and verify GREEN**

Run: `node --test test/transactions-client.test.js test/transactions-ui.test.js`

Expected: helper and UI contract tests pass.

---

### Task 5: Full verification and review

**Files:**
- Review: all modified files

**Interfaces:**
- Verifies the deliverables from Tasks 1–4 together.

- [ ] **Step 1: Run DB-independent focused tests**

Run: `node --test test/dashboard-comparison.test.js test/dashboard-ui.test.js test/visual-system.test.js test/responsive-ui.test.js test/transactions-client.test.js test/transactions-ui.test.js`

Expected: zero failures.

- [ ] **Step 2: Run the full test suite**

Run: `pnpm test`

Expected: report exact results. If the canonical DB is absent, separate those environment failures from DB-independent failures rather than using an alternate path.

- [ ] **Step 3: Run the production build**

Run: `pnpm run build`

Expected: exit code 0; report the existing NFT tracing warning if it remains.

- [ ] **Step 4: Inspect the final diff**

Run: `git diff --check && git status --short && git diff --stat && git diff -- <modified files>`

Expected: no whitespace errors, no database file changes, and only planned source/docs/test files modified.
