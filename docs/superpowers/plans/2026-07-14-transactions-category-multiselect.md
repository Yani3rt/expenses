# Transactions Category Multiselect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the transactions category select with an accessible dependency-free checkbox dropdown that supports OR filtering across repeated `category` URL parameters.

**Architecture:** A focused `lib/transaction-filters.js` module normalizes category values and serializes repeated URL parameters. Server page/API boundaries and the read-only SQLite query consume category arrays; the existing client filter component renders the dropdown and individual chips while pagination preserves the same URL shape.

**Tech Stack:** Next.js App Router, React, JavaScript, Node test runner, SQLite `DatabaseSync`, existing CSS design tokens.

## Global Constraints

- Do not add production dependencies.
- Keep the expense database read-only; use SELECT statements only.
- Use repeated `category` query parameters as the canonical URL representation.
- Multiple categories use OR semantics.
- Show `All categories` first, followed by selectable category names.
- Apply selection changes immediately and reset pagination offset.

---

### Task 1: Category parameter helpers and query behavior

**Files:**
- Create: `lib/transaction-filters.js`
- Modify: `lib/queries.js`
- Test: `test/transaction-filters.test.js`
- Test: `test/filters.test.js`

**Interfaces:**
- Produces: `normalizeCategoryValues(value, allowedSlugs?) -> string[]` and `replaceCategoryParams(params, values) -> URLSearchParams`.
- Produces: `getTransactionsData({ categories })` metadata with `meta.categories: string[]`.

- [ ] **Step 1: Write failing helper and query tests**

```js
test("normalizes repeated category values", () => {
  assert.deepEqual(normalizeCategoryValues(["food", "travel", "food", "all"]), ["food", "travel"]);
});

test("transactions include every selected category", () => {
  const data = getTransactionsData({ categories: ["food", "travel"] });
  assert.ok(data.transactions.length > 0);
  assert.ok(data.transactions.every((row) => ["food", "travel"].includes(row.categorySlug)));
  assert.deepEqual(data.meta.categories, ["food", "travel"]);
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `pnpm test -- test/transaction-filters.test.js test/filters.test.js`

Expected: FAIL because `lib/transaction-filters.js` and the `categories` query input do not exist.

- [ ] **Step 3: Implement normalized arrays and named `IN` placeholders**

```js
export function normalizeCategoryValues(value, allowedSlugs) {
  const values = (Array.isArray(value) ? value : [value])
    .flatMap((entry) => String(entry || "").split(","))
    .map((entry) => entry.trim())
    .filter((entry) => entry && entry !== "all");
  const allowed = allowedSlugs ? new Set(allowedSlugs) : null;
  return [...new Set(values.filter((entry) => !allowed || allowed.has(entry)))];
}
```

In `getTransactionsData`, map validated slugs to `:category0`, `:category1`, and build `c.slug IN (...)`. Preserve the legacy singular `category` input as a normalization fallback for existing internal links.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `pnpm test -- test/transaction-filters.test.js test/filters.test.js`

Expected: PASS with zero failures.

### Task 2: Repeated URL parameters across page, APIs, and pagination

**Files:**
- Modify: `app/transactions/page.js`
- Modify: `app/api/transactions/route.js`
- Modify: `app/api/expenses/route.js`
- Modify: `components/TransactionsLedger.js`
- Modify: `lib/transaction-filters.js`
- Test: `test/transaction-filters.test.js`
- Test: `test/transactions-ui.test.js`

**Interfaces:**
- Consumes: `normalizeCategoryValues` and `replaceCategoryParams` from Task 1.
- Produces: repeated `category` params at every navigation and API boundary.

- [ ] **Step 1: Write failing serialization and boundary tests**

```js
test("replaces category params without disturbing other filters", () => {
  const params = new URLSearchParams("q=cloud&category=home");
  replaceCategoryParams(params, ["food", "travel"]);
  assert.equal(params.toString(), "q=cloud&category=food&category=travel");
});
```

Add source assertions that page boundaries use array-aware category reads and pagination appends each selected category.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `pnpm test -- test/transaction-filters.test.js test/transactions-ui.test.js`

Expected: FAIL because boundaries still use singular `get`/string values.

- [ ] **Step 3: Implement repeated-parameter propagation**

Use `searchParams.getAll("category")` in route handlers. Normalize the App Router page value because repeated keys may arrive as an array. In all URL builders, delete existing `category` keys and append each selected slug. Pagination must use the same helper before calling `/api/transactions`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `pnpm test -- test/transaction-filters.test.js test/transactions-ui.test.js`

Expected: PASS with zero failures.

### Task 3: Accessible multiselect dropdown and active chips

**Files:**
- Modify: `components/TransactionsFilters.js`
- Modify: `app/globals.css`
- Test: `test/transactions-ui.test.js`

**Interfaces:**
- Consumes: `meta.categories: string[]` and repeated-parameter helpers.
- Produces: immediate category selection navigation and one removal chip per selected category.

- [ ] **Step 1: Write failing UI structure tests**

```js
test("category filter is a non-native checkbox dropdown", () => {
  assert.match(transactionsFilters, /category-multiselect-trigger/);
  assert.match(transactionsFilters, /All categories/);
  assert.match(transactionsFilters, /role="checkbox"/);
  assert.match(transactionsFilters, /aria-checked/);
  assert.doesNotMatch(transactionsFilters, /<select name="category"/);
});
```

Also assert that active chips iterate over `meta.categories` and remove only the selected slug.

- [ ] **Step 2: Run the UI tests and verify RED**

Run: `pnpm test -- test/transactions-ui.test.js`

Expected: FAIL because the category control is still a native select.

- [ ] **Step 3: Implement the dropdown behavior and styling**

Add a `CategoryMultiselect` client component with a trigger button, anchored panel, `All categories` clear action, and checkbox category buttons. Manage open state with `useRef`, outside pointer handling, Escape handling, and trigger focus restoration. Apply category changes through the existing `navigate` function and calculate trigger copy from the selected catalog entries.

Update active chips to create one category chip per selected slug. Add `.category-multiselect`, `.category-multiselect-trigger`, `.category-multiselect-panel`, and `.category-multiselect-option` styles using existing surface, outline, primary, and focus tokens.

- [ ] **Step 4: Run the UI tests and verify GREEN**

Run: `pnpm test -- test/transactions-ui.test.js`

Expected: PASS with zero failures.

### Task 4: Full regression and browser verification

**Files:**
- Verify: all changed files

**Interfaces:**
- Consumes: completed Tasks 1-3.
- Produces: verified production behavior.

- [ ] **Step 1: Run the complete test suite**

Run: `pnpm test`

Expected: all tests pass with zero failures.

- [ ] **Step 2: Run the production build**

Run: `pnpm run build`

Expected: exit code 0 with successful Next.js compilation.

- [ ] **Step 3: Verify the live page in a browser**

At `/transactions`, open Category, select two categories, confirm both checkmarks, separate chips, matching rows, and repeated category parameters. Remove one chip, choose `All categories`, press Escape while open, and inspect desktop and narrow layouts.

- [ ] **Step 4: Review the final diff**

Run: `git diff --check && git status --short`

Expected: no whitespace errors and only intended source, test, CSS, and documentation changes.

### Task 5: Filter-aware category availability

**Files:**
- Modify: `lib/queries.js`
- Modify: `components/TransactionsFilters.js`
- Modify: `app/globals.css`
- Test: `test/filters.test.js`
- Test: `test/transactions-ui.test.js`

**Interfaces:**
- Produces: category catalog entries with `expenseCount` and `disabled` presentation derived from active search/date/month filters, excluding category selections.
- Produces: `All categories` selection that clears categories and closes the dropdown.

- [ ] **Step 1: Write failing availability and UI tests**

Assert that `getTransactionsData({ period: "this_month" }).categories` assigns zero to categories without matching period expenses and positive counts to available categories. Add UI source assertions for disabled zero-count options, selected-option override, and `setIsOpen(false)` in the All categories handler.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `EXPENSE_DB_PATH=/tmp/expense-viewer-multiselect-test.db node --test test/filters.test.js test/transactions-ui.test.js`

Expected: FAIL because category catalog entries do not expose filtered expense counts and All categories does not close the panel.

- [ ] **Step 3: Implement one category availability aggregate**

Build search/date predicates independently from the category predicate, aggregate expense counts by category with those predicates, and merge counts into the stable category catalog. Disable only unselected zero-count options in the component. Add an All categories handler that clears selection and closes the panel.

- [ ] **Step 4: Run focused and full verification**

Run: `EXPENSE_DB_PATH=/tmp/expense-viewer-multiselect-test.db pnpm test`

Expected: all tests pass with zero failures, followed by a successful `pnpm run build` and browser verification of enabled, disabled, selected, and auto-close states.
