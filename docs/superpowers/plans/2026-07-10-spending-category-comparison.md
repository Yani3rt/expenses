# Spending Category Comparison Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the redundant Spending bars and donut with a real selected-month versus previous-month category comparison while retaining detailed category cards.

**Architecture:** Add a pure comparison helper that merges current and previous category aggregates without requiring SQLite, expose its result from `getSpendingData()`, and render it through a focused server component. The existing dashboard primitives remain unchanged; only the Spending page stops rendering `CategoryBars` and `Donut`.

**Tech Stack:** Next.js App Router, React server components, Node `node:test`, Node SQLite in enforced read-only mode, plain CSS.

## Global Constraints

- Use `pnpm` for project commands.
- Add no production dependencies.
- Keep database access read-only; never mutate `/Users/yani/Dev/expenses/expenses.db` or the canonical expense database.
- A selected month compares with the immediately previous calendar month.
- `All` remains a historical, non-comparison view.
- Keep `CategoryDetailCards`; remove Spending-only `CategoryBars` and `Donut` rendering.

---

### Task 1: Pure category comparison model

**Files:**
- Create: `lib/spending-comparison.js`
- Create: `test/spending-comparison.test.js`

**Interfaces:**
- Consumes: `{ activeMonth, previousMonth, currentCategories, previousCategories }`.
- Produces: `buildSpendingComparison(input)` returning `{ mode, activeMonth, previousMonth, currentTotal, previousTotal, deltaAmount, deltaPercent, rows }`.

- [ ] **Step 1: Write failing comparison tests**

Cover merged current/previous categories, current-only `new` categories, previous-only negative rows, absolute-delta sorting, null percentage for zero baselines, and `all` mode share values.

- [ ] **Step 2: Verify the tests fail**

Run: `node --test test/spending-comparison.test.js`

Expected: failure because `lib/spending-comparison.js` does not exist.

- [ ] **Step 3: Implement the pure helper**

Normalize money to two decimals, merge by `categorySlug`, calculate row and total deltas, assign `new|up|down|flat`, and sort comparison rows by `Math.abs(deltaAmount)` descending. For `all`, map current rows with `sharePercent` and omit comparison deltas.

- [ ] **Step 4: Verify the helper tests pass**

Run: `node --test test/spending-comparison.test.js`

Expected: all comparison-model tests pass.

### Task 2: Read-only previous-month query composition

**Files:**
- Modify: `lib/queries.js`
- Modify: `test/spending-ui.test.js`

**Interfaces:**
- Consumes: `buildSpendingComparison()` from Task 1 and the existing `shiftMonth()` helper.
- Produces: `getSpendingData()` fields `previousMonth`, `previousSummary`, and `comparison` while preserving `categories` for `CategoryDetailCards`.

- [ ] **Step 1: Write failing source-contract tests**

Assert that `getSpendingData()` calculates `previousMonth`, queries previous category aggregates with a read-only `SELECT`, invokes `buildSpendingComparison`, and returns `comparison`.

- [ ] **Step 2: Verify the source-contract test fails**

Run: `node --test test/spending-ui.test.js`

Expected: the new comparison-query assertions fail.

- [ ] **Step 3: Implement previous-period data flow**

For concrete months, use `shiftMonth(activeMonth, -1)`, query the prior summary and category aggregates, and pass both category arrays to the pure helper. For `all`, use no prior query and build historical mode from current categories.

- [ ] **Step 4: Verify model and query tests pass**

Run: `node --test test/spending-comparison.test.js test/spending-ui.test.js`

Expected: all tests pass.

### Task 3: Consolidated category comparison UI

**Files:**
- Create: `components/CategoryComparison.js`
- Modify: `app/spending/page.js`
- Modify: `test/spending-ui.test.js`

**Interfaces:**
- Consumes: `data.comparison`, `money()`, `monthLabel()`, `categoryTone()`, and existing category icons.
- Produces: a full-width comparison section whose rows link to `/transactions?month=<activeMonth>&category=<categorySlug>`.

- [ ] **Step 1: Write failing UI-contract tests**

Assert that Spending renders `CategoryComparison`, removes `CategoryBars` and `Donut`, retains `CategoryDetailCards`, uses a second summary metric for total period change in comparison mode, and keeps average expense for `all` mode.

- [ ] **Step 2: Verify the UI-contract tests fail**

Run: `node --test test/spending-ui.test.js`

Expected: assertions fail because the component and new composition do not exist.

- [ ] **Step 3: Implement `CategoryComparison`**

Render explicit current/previous column labels, signed deltas, nullable percentage copy, proportional paired bars, and category-filtered links. Render historical total/count/share rows in `all` mode and a clear empty state when no rows exist.

- [ ] **Step 4: Update the Spending page composition**

Remove Spending imports and rendering for `CategoryBars` and `Donut`. Render the comparison first and keep `<CategoryDetailCards categories={data.categories} />` below it. Change the lede to explain the concrete comparison.

- [ ] **Step 5: Verify UI tests pass**

Run: `node --test test/spending-ui.test.js test/spending-comparison.test.js`

Expected: all tests pass.

### Task 4: Responsive comparison styling

**Files:**
- Modify: `app/globals.css`
- Modify: `test/spending-ui.test.js`

**Interfaces:**
- Consumes: semantic class names emitted by `CategoryComparison`.
- Produces: readable desktop comparison columns and a stacked mobile layout without horizontal page overflow.

- [ ] **Step 1: Write failing styling assertions**

Assert full-width comparison placement, paired-bar styles, direction colors, and a mobile breakpoint that stacks amount/delta content while preserving category identity.

- [ ] **Step 2: Verify styling assertions fail**

Run: `node --test test/spending-ui.test.js`

Expected: new CSS assertions fail.

- [ ] **Step 3: Add restrained comparison styles**

Use existing surface, outline, typography, and tone tokens. Avoid new gradients, shadows, looping motion, or decorative cards. Make rows compact, scan-friendly, and responsive below 760px.

- [ ] **Step 4: Verify focused tests pass**

Run: `node --test test/spending-comparison.test.js test/spending-ui.test.js test/responsive-ui.test.js test/visual-system.test.js`

Expected: all focused tests pass.

### Task 5: Full verification and live review

**Files:**
- Verify all modified files.

**Interfaces:**
- Consumes: complete feature.
- Produces: verified source, build, and local review state.

- [ ] **Step 1: Run the deterministic detector**

Run: `node /Users/yani/.agents/skills/impeccable/scripts/detector/detect-antipatterns.mjs --json app components`

Expected: `[]`.

- [ ] **Step 2: Run focused and repository test suites**

Run: `node --test test/spending-comparison.test.js test/spending-ui.test.js test/responsive-ui.test.js test/visual-system.test.js`

Expected: all focused tests pass.

Run: `pnpm test`

Expected locally: feature tests pass; DB-coupled tests may require the configured read-only database.

- [ ] **Step 3: Build and inspect the diff**

Run: `pnpm run build && git diff --check`

Expected: build exits 0 and diff check reports no errors.

- [ ] **Step 4: Smoke-test the live page**

Use the already approved localhost-only server with `EXPENSE_DB_PATH=/Users/yani/Dev/expenses/expenses.db`, reload `/spending`, and verify the selected month, previous month, category deltas, retained detail cards, and filtered transaction links.
