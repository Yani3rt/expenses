# Month Spend Sparkline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a responsive daily-total sparkline behind the Dashboard Month spend metric content.

**Architecture:** Extend `MetricCard` with an optional `sparklineData` prop. A small internal SVG renderer normalizes positive daily totals into a responsive viewBox and is rendered only when data is supplied; existing metric cards remain unchanged.

**Tech Stack:** React Server Components, JSX SVG, CSS, Node test runner.

## Global Constraints

- Do not add production dependencies.
- Keep database access read-only.
- Plot only days with recorded expenses.
- Render no graph numbers or interactive controls.

---

### Task 1: Add the metric sparkline

**Files:**
- Modify: `components/DashboardPrimitives.js`
- Modify: `app/page.js`
- Modify: `app/globals.css`
- Test: `test/dashboard-ui.test.js`

**Interfaces:**
- Consumes: `MetricCard({ sparklineData })`, where each item has `date` and `totalSpend`.
- Produces: decorative `.metric-sparkline` SVG behind the existing card content.

- [ ] **Step 1: Write failing source-contract tests**

Assert that the Month spend card passes `data.dailyTotals`, the metric component renders an `aria-hidden` SVG, and CSS layers it behind `.metric-head`, the value, and detail.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test test/dashboard-ui.test.js`

- [ ] **Step 3: Implement the SVG and card wiring**

Normalize values into a `0 0 100 48` viewBox, render a line plus area polygon, and pass `data.dailyTotals` only to Month spend.

- [ ] **Step 4: Add responsive decorative styling**

Position the SVG absolutely across the card background with low-opacity blue strokes/fill and put existing content at `z-index: 1`.

- [ ] **Step 5: Verify**

Run `EXPENSE_DB_PATH=/Users/yani/Dev/expenses/expenses.db pnpm test`, `EXPENSE_DB_PATH=/Users/yani/Dev/expenses/expenses.db pnpm run build`, and `git diff --check`.

- [ ] **Step 6: Commit**

Commit the implementation with `feat: add month spend sparkline`.
