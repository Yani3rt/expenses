# Dashboard Daily Spending Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Category totals with top-10 Recent spending, add a current-month active-day chart beside Largest expenses, and show dollar amounts in the share ranking.

**Architecture:** Extend the read-only dashboard query with daily aggregates and ten recent transactions. Compose the dashboard with the existing bounded category row, a focused `DailySpendingChart` server component, and the existing `ExpenseList`. Keep percentage state in the donut center but render money in its ranking.

**Tech Stack:** Next.js App Router, React server/client components, Node SQLite read-only queries, Node `node:test`, plain CSS.

## Global Constraints

- Implement directly on `main` as explicitly requested.
- Use `pnpm` for project commands.
- Add no production dependencies.
- Preserve read-only database access.
- Daily chart includes spending days only; do not synthesize zero-value dates.
- Recent spending contains the 10 latest transactions.
- Remove duplicate Category totals and lower Recent expenses cards.

---

### Task 1: Dashboard daily and recent data

**Files:**
- Modify: `lib/queries.js`
- Modify: `test/dashboard-ui.test.js`
- Modify: `test/queries.test.js`

**Interfaces:**
- Produces: `getDashboardData().dailyTotals` rows shaped `{ date, expenseCount, totalSpend }` and `recentExpenses` capped at 10.

- [ ] **Step 1: Write failing query contracts**

Assert the dashboard query groups current-month expenses by `expense_date`, orders ascending, returns `dailyTotals`, and slices recent transactions to ten. Extend the DB-backed query test to validate non-empty, ascending current-month daily rows.

- [ ] **Step 2: Verify RED**

Run: `EXPENSE_DB_PATH=/Users/yani/Dev/expenses/expenses.db node --test test/dashboard-ui.test.js test/queries.test.js`

Expected: new daily/recent assertions fail.

- [ ] **Step 3: Implement read-only daily aggregation**

Add a grouped `SELECT` using the existing `activeMonth` parameter. Return `dailyTotals` and change `recentExpenses` to `transactions.transactions.slice(0, 10)`.

- [ ] **Step 4: Verify GREEN**

Run: `EXPENSE_DB_PATH=/Users/yani/Dev/expenses/expenses.db node --test test/dashboard-ui.test.js test/queries.test.js`

Expected: all focused query tests pass.

### Task 2: Dashboard composition and dollar share ranking

**Files:**
- Modify: `app/page.js`
- Modify: `components/InteractiveDonut.js`
- Modify: `test/dashboard-ui.test.js`

**Interfaces:**
- Consumes: `data.recentExpenses`, `data.dailyTotals`, and share rows with `totalSpend`.
- Produces: top row Recent spending + Category share, full-width Monthly trend, bottom Daily spending + Largest expenses.

- [ ] **Step 1: Write failing composition contracts**

Assert CategoryBars is removed from the dashboard page, the bounded category row renders top-10 Recent spending beside Donut, the lower duplicate Recent expenses card is gone, DailySpendingChart precedes Largest expenses, and the share ranking uses `money(row.totalSpend)`.

- [ ] **Step 2: Verify RED**

Run: `node --test test/dashboard-ui.test.js`

Expected: new composition and money assertions fail.

- [ ] **Step 3: Update share ranking and page layout**

Keep center percentage rendering unchanged. Replace ranked percentage with dollar formatting. Move ExpenseList into `dashboard-category-row`, remove CategoryBars from the page import/composition, remove the lower recent card, and render DailySpendingChart plus Largest expenses at span six.

- [ ] **Step 4: Verify GREEN**

Run: `node --test test/dashboard-ui.test.js`

Expected: dashboard composition contracts pass.

### Task 3: Active-day chart component

**Files:**
- Create: `components/DailySpendingChart.js`
- Modify: `test/dashboard-ui.test.js`

**Interfaces:**
- Consumes: `dailyTotals` rows from Task 1 and optional `className`.
- Produces: spending-day count, active-day average, peak day, and vertically scaled date bars.

- [ ] **Step 1: Write failing component contracts**

Assert the component calculates `maxSpend`, `totalSpend`, `averagePerDay`, uses `shortDate`, renders only `dailyTotals.map`, and includes the approved labels `Daily spending`, `Spending days this month`, and `Average per spending day`.

- [ ] **Step 2: Verify RED**

Run: `node --test test/dashboard-ui.test.js`

Expected: component file/source assertions fail.

- [ ] **Step 3: Implement the server component**

Handle empty arrays with a clear empty state. For rows, calculate chart height percentage relative to the maximum, render money above each bar and short date below, and render compact summary items.

- [ ] **Step 4: Verify GREEN**

Run: `node --test test/dashboard-ui.test.js`

Expected: all component contracts pass.

### Task 4: Responsive daily chart and layout

**Files:**
- Modify: `app/globals.css`
- Modify: `test/dashboard-ui.test.js`
- Modify: `test/responsive-ui.test.js`

**Interfaces:**
- Consumes: `daily-spending-*` class names and the existing dashboard category wrapper.
- Produces: contained horizontal rail, vertical bar scaling, 6/6 desktop bottom row, and one-column mobile stacking.

- [ ] **Step 1: Write failing style contracts**

Assert the daily rail uses horizontal overflow and grid auto-flow columns, tracks have a fixed readable height, bars use the blue token, and mobile keeps overflow inside the card.

- [ ] **Step 2: Verify RED**

Run: `node --test test/dashboard-ui.test.js test/responsive-ui.test.js`

Expected: daily chart style assertions fail.

- [ ] **Step 3: Add restrained chart styles**

Use existing surface, outline, type, and blue tokens. Avoid gradients, shadows, or decorative animation. Ensure labels and values do not overflow narrow bars.

- [ ] **Step 4: Verify focused tests**

Run: `node --test test/dashboard-ui.test.js test/responsive-ui.test.js test/visual-system.test.js`

Expected: all focused tests pass.

### Task 5: Full verification and commit

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run detector and full tests**

Run: `node /Users/yani/.agents/skills/impeccable/scripts/detector/detect-antipatterns.mjs --json app components`

Expected: `[]`.

Run: `EXPENSE_DB_PATH=/Users/yani/Dev/expenses/expenses.db pnpm test`

Expected: all tests pass and read-only writes remain rejected.

- [ ] **Step 2: Build and inspect diff**

Run: `pnpm run build && git diff --check`

Expected: build succeeds and diff check is clean.

- [ ] **Step 3: Review running server**

Refresh `http://127.0.0.1:8788/`; confirm the new layout, dollar ranking, 10 recent rows, active-day chart, retained sticky stop, and no server errors.

- [ ] **Step 4: Commit**

Stage only implementation and test files. Commit with `feat: add dashboard daily spending`.
