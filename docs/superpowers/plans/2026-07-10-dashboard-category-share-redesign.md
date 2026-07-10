# Dashboard Category Share Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stretched dashboard donut with a percentage-first, top-six-plus-Other interactive share card and ranked legend.

**Architecture:** A pure helper prepares complete share data independently from React and SQLite. `InteractiveDonut` consumes the prepared rows, maintains one active selection shared by the SVG and ranking, and routes only real categories to filtered Transactions. CSS makes the card natural-height and sticky on desktop while reverting to normal flow responsively.

**Tech Stack:** Next.js App Router, React client component, SVG circles, Node `node:test`, plain CSS.

## Global Constraints

- Implement directly on `main` as explicitly requested by the user.
- Use `pnpm` for project commands.
- Add no production dependencies.
- Preserve read-only database behavior.
- Show the six largest categories plus an aggregated Other segment.
- Prioritize percentage share; dollar amounts remain secondary.
- Avoid gradients, looping animation, and layout-affecting animated properties.

---

### Task 1: Pure share model

**Files:**
- Create: `lib/category-share.js`
- Create: `test/category-share.test.js`

**Interfaces:**
- Consumes: `buildCategoryShare(categories, { limit = 6 } = {})` where category rows expose `category`, `categorySlug`, `totalSpend`, and `expenseCount`.
- Produces: `{ totalSpend, rows }`; rows expose normalized totals, `sharePercent`, and `isOther`.

- [ ] **Step 1: Write failing unit tests**

Cover descending sorting, six-row preservation, aggregation of remaining rows into Other, full-total percentage calculation, exact-six behavior without Other, and empty input.

- [ ] **Step 2: Verify RED**

Run: `node --test test/category-share.test.js`

Expected: failure because `lib/category-share.js` does not exist.

- [ ] **Step 3: Implement the helper**

Normalize money to two decimals, sort without mutating input, aggregate overflow totals/counts, calculate share percentages from the full total, and return an empty result safely.

- [ ] **Step 4: Verify GREEN**

Run: `node --test test/category-share.test.js`

Expected: all share-model tests pass.

### Task 2: Percentage-first donut and ranking

**Files:**
- Modify: `components/InteractiveDonut.js`
- Modify: `test/dashboard-ui.test.js`

**Interfaces:**
- Consumes: `buildCategoryShare(categories)` from Task 1.
- Produces: a total/default state, interactive SVG segments, ranked percentage rows, real-category filtered links, and a non-link Other row.

- [ ] **Step 1: Write failing UI-contract tests**

Assert the helper import, `100%` total center state, percentage-first active state, `All categories` reset control, `share-ranking`, filtered category routing, `isOther` handling, and removal of the old pill legend.

- [ ] **Step 2: Verify RED**

Run: `node --test test/dashboard-ui.test.js test/category-share.test.js`

Expected: new UI assertions fail.

- [ ] **Step 3: Implement the redesigned component**

Use `activeSlug = null` for the total state. Build SVG slices from prepared rows and the full total. Update active state from segment/ranking hover and focus. Render percentage as the primary center value, dollar amount as secondary, and route only non-Other rows.

- [ ] **Step 4: Verify GREEN**

Run: `node --test test/dashboard-ui.test.js test/category-share.test.js`

Expected: all focused behavior tests pass.

### Task 3: Natural-height sticky layout

**Files:**
- Modify: `app/globals.css`
- Modify: `test/dashboard-ui.test.js`
- Modify: `test/responsive-ui.test.js`

**Interfaces:**
- Consumes: donut and ranking class names from Task 2.
- Produces: natural card height, sticky desktop placement, ranked rows, clear active state, and non-sticky responsive behavior.

- [ ] **Step 1: Write failing CSS-contract tests**

Assert `align-self: start`, sticky desktop positioning, a compact donut stage, ranked row layout, and responsive `position: static` with a stacked layout.

- [ ] **Step 2: Verify RED**

Run: `node --test test/dashboard-ui.test.js test/responsive-ui.test.js`

Expected: new styling assertions fail.

- [ ] **Step 3: Add restrained responsive styles**

Remove old legend-pill styling from the donut path. Add section header, percentage center, ranking rows, All categories control, desktop sticky positioning, and responsive reset below 980px.

- [ ] **Step 4: Verify focused tests**

Run: `node --test test/category-share.test.js test/dashboard-ui.test.js test/responsive-ui.test.js test/visual-system.test.js`

Expected: all focused tests pass.

### Task 4: Full and live verification

**Files:**
- Verify all modified files.

**Interfaces:**
- Consumes: completed redesign.
- Produces: verified main-branch implementation.

- [ ] **Step 1: Run detector and full tests**

Run: `node /Users/yani/.agents/skills/impeccable/scripts/detector/detect-antipatterns.mjs --json app components`

Expected: `[]`.

Run: `EXPENSE_DB_PATH=/Users/yani/Dev/expenses/expenses.db pnpm test`

Expected: all tests pass and the database read-only test rejects writes.

- [ ] **Step 2: Build and inspect diff**

Run: `pnpm run build && git diff --check`

Expected: build succeeds and diff check is clean.

- [ ] **Step 3: Verify live dashboard**

Reload `http://127.0.0.1:8788/`, verify the 100% default, active percentage state, Other aggregation when applicable, ranking interaction, filtered routing, natural card height, and zero browser console errors.

- [ ] **Step 4: Commit implementation**

Stage only the helper, component, CSS, and tests. Commit with `feat: redesign dashboard category share`.
