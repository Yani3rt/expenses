# Responsive Active-Day Chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Filter zero-spend dates from the transaction modal chart on tablet and mobile while retaining the full calendar on desktop.

**Architecture:** Add a local `matchMedia`-backed hook in `TransactionDetailDialog.js`. Build the full month once, then select either the complete dataset or its positive-total rows according to the existing 1080px tablet breakpoint.

**Tech Stack:** React, Dither Kit BarChart, Node test runner

## Global Constraints

- Use `max-width: 1080px` for tablet and mobile behavior.
- Preserve the full calendar chart above 1080px.
- Do not add dependencies.
- Keep database access read-only.

---

### Task 1: Responsive active-day chart data

**Files:**
- Modify: `components/TransactionDetailDialog.js`
- Test: `test/transactions-ui.test.js`

**Interfaces:**
- Consumes: `buildMonthChartData(categoryMonth)` and `window.matchMedia`.
- Produces: `chartData` containing either all calendar days or only rows with `totalSpend > 0`.

- [ ] **Step 1: Write the failing test**

Assert that the dialog subscribes to `(max-width: 1080px)`, filters the full chart data by positive `totalSpend`, and passes the responsive result to `BarChart`.

- [ ] **Step 2: Verify the test fails**

Run `pnpm test --test-name-pattern="category month chart shows only active days on tablet and mobile"` and confirm the media-query behavior is missing.

- [ ] **Step 3: Implement the minimal behavior**

Import `useState`, add a media-query hook with change cleanup, retain `fullChartData`, and filter it only when the compact breakpoint matches.

- [ ] **Step 4: Verify the implementation**

Run `EXPENSE_DB_PATH=/Users/yani/Dev/expenses/expenses.db pnpm test` and `EXPENSE_DB_PATH=/Users/yani/Dev/expenses/expenses.db pnpm run build` using the read-only local fixture.

- [ ] **Step 5: Inspect both responsive modes**

Confirm desktop retains the full month and tablet/mobile show only positive-spend day labels and bars.
