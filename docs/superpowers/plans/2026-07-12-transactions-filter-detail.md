# Transactions Filter and Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify desktop transaction filters and add a filter-aware transaction insight modal.

**Architecture:** Reuse the existing URL filter model and read-only query layer. Add one focused detail query and API route, then render its result in an accessible client dialog opened by semantic ledger-row buttons.

**Tech Stack:** Next.js App Router, React, Node test runner, SQLite read-only query helpers, existing CSS design system.

## Global Constraints

- Do not add production dependencies.
- Never write to or mutate the canonical expense database.
- Metrics follow the current search, period, month, and category filters; sort, offset, and limit do not change the comparison population.
- Preserve URL-backed filtering and current mobile filter behavior.

---

### Task 1: Filter-aware transaction insight query

**Files:**
- Modify: `lib/queries.js`
- Test: `test/queries.test.js`

**Interfaces:**
- Produces: `getTransactionDetailData({ id, q, period, month, category })`, returning `{ transaction, context }` or `null`.
- `context` contains `rank`, `resultCount`, `spendSharePercent`, `differenceFromAverage`, `filteredAverage`, `categoryAverage`, `categoryRank`, and `categorySharePercent`.

- [ ] **Step 1: Write failing query tests**

Add fixture-backed assertions that a known transaction's rank, filtered average, spend share, category average/rank/share, and search/month/period/category constraints are calculated against the entire filtered population.

- [ ] **Step 2: Verify the focused tests fail**

Run: `node --test test/queries.test.js`

Expected: FAIL because `getTransactionDetailData` is not exported.

- [ ] **Step 3: Implement the minimal read-only query**

Reuse the existing period and filter normalization helpers. Select the transaction, calculate the filtered aggregate and category aggregate, and rank with deterministic amount/date/id ordering. Return rounded percentage and difference values without issuing any write statement.

- [ ] **Step 4: Verify query tests pass**

Run: `node --test test/queries.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/queries.js test/queries.test.js
git commit -m "feat: add filtered transaction insights"
```

### Task 2: Read-only detail API and client fetcher

**Files:**
- Create: `app/api/transactions/[id]/route.js`
- Modify: `lib/transactions-client.js`
- Test: `test/transactions-client.test.js`
- Test: `test/read-only.test.js`

**Interfaces:**
- Consumes: `getTransactionDetailData(filters)` from Task 1.
- Produces: `fetchTransactionDetail(url, options?)` returning validated `{ transaction, context }`.

- [ ] **Step 1: Write failing API-contract and client tests**

Cover valid response parsing, malformed payload rejection, non-OK response messaging, invalid numeric IDs, missing records, and source-level proof that the route only delegates to read-only queries.

- [ ] **Step 2: Verify focused tests fail**

Run: `node --test test/transactions-client.test.js test/read-only.test.js`

Expected: FAIL because the detail fetcher and route do not exist.

- [ ] **Step 3: Implement route and fetcher**

The route parses `id`, `q`, `period`, `month`, and `category`, calls `getTransactionDetailData`, returns 400 for invalid IDs, 404 for missing transactions, and 200 for valid detail. The client fetcher accepts an optional abort signal and validates the payload before returning it.

- [ ] **Step 4: Verify focused tests pass**

Run: `node --test test/transactions-client.test.js test/read-only.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/transactions/[id]/route.js lib/transactions-client.js test/transactions-client.test.js test/read-only.test.js
git commit -m "feat: expose transaction insight details"
```

### Task 3: Simplified desktop filter disclosure

**Files:**
- Modify: `components/TransactionsFilters.js`
- Modify: `app/globals.css`
- Test: `test/transactions-ui.test.js`
- Test: `test/responsive-ui.test.js`

**Interfaces:**
- Produces: one responsive disclosure controlling the month/category/sort panel and exposing the advanced active-filter count.

- [ ] **Step 1: Write failing markup and responsive CSS tests**

Assert that `More filters` is available on desktop, includes a count derived from non-default month/category/sort values, controls the advanced panel with `aria-expanded`, and that mobile retains its compact Filters presentation.

- [ ] **Step 2: Verify focused tests fail**

Run: `node --test test/transactions-ui.test.js test/responsive-ui.test.js`

Expected: FAIL because desktop currently keeps advanced selects permanently visible.

- [ ] **Step 3: Implement the disclosure**

Calculate the active advanced count from `meta`, reuse `isExpanded`, label the control `More filters` on desktop and `Filters` on mobile, and make the panel visibility responsive without changing navigation behavior. Remove the idle pending-status layout gap and reduce the active preset shadow.

- [ ] **Step 4: Verify focused tests pass**

Run: `node --test test/transactions-ui.test.js test/responsive-ui.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/TransactionsFilters.js app/globals.css test/transactions-ui.test.js test/responsive-ui.test.js
git commit -m "feat: simplify desktop transaction filters"
```

### Task 4: Accessible transaction insight dialog

**Files:**
- Create: `components/TransactionDetailDialog.js`
- Modify: `components/TransactionsLedger.js`
- Modify: `components/DashboardPrimitives.js`
- Modify: `app/globals.css`
- Test: `test/transactions-ui.test.js`

**Interfaces:**
- Consumes: `fetchTransactionDetail(url, { signal })` and current ledger `meta`.
- Produces: semantic ledger row triggers and `TransactionDetailDialog` with loading, success, error, retry, close, Escape, backdrop, and focus-restoration behavior.

- [ ] **Step 1: Write failing UI structure tests**

Assert that ledger rows can render as buttons, the dialog has `role="dialog"`, `aria-modal="true"`, a labeled title, loading and retry copy, metric labels, comparison chart semantics, and close controls.

- [ ] **Step 2: Verify the focused UI test fails**

Run: `node --test test/transactions-ui.test.js`

Expected: FAIL because the dialog and row-trigger behavior do not exist.

- [ ] **Step 3: Implement the modal and row triggers**

Open the dialog with the row's existing data, request filter-aware insight details, abort stale requests, trap Tab navigation inside the dialog, close on Escape/backdrop/close, and restore focus to the originating row. Render three headline metrics and a proportional three-bar comparison for transaction amount, filtered average, and category average.

- [ ] **Step 4: Replace false hover affordances**

Remove translation from static expense rows. Scope restrained interactive hover and focus-visible styles to ledger row buttons, preserving non-interactive dashboard rows.

- [ ] **Step 5: Verify focused tests pass**

Run: `node --test test/transactions-ui.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/TransactionDetailDialog.js components/TransactionsLedger.js components/DashboardPrimitives.js app/globals.css test/transactions-ui.test.js
git commit -m "feat: add transaction insight dialog"
```

### Task 5: Full verification

**Files:**
- Modify only if verification uncovers a regression.

- [ ] **Step 1: Run the complete test suite**

Run: `pnpm test`

Expected: all tests pass.

- [ ] **Step 2: Run the production build**

Run: `pnpm run build`

Expected: Next.js build completes successfully.

- [ ] **Step 3: Verify the live transactions workflow**

At desktop and mobile widths, verify search and quick presets remain visible, More filters opens and reports active count, a row opens its modal, filtered metrics load, keyboard focus stays in the dialog, Escape closes it, focus returns to the row, and retry preserves base transaction information.

- [ ] **Step 4: Commit verification fixes if needed**

```bash
git add <only-files-changed-by-verification>
git commit -m "fix: polish transaction detail workflow"
```

