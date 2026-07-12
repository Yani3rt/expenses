# Category Month Modal Colorize Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a restrained category-aware color treatment to the transaction category-month modal without weakening readability or changing its data behavior.

**Architecture:** Reuse the existing `--category-accent` inline custom property as the single semantic color source for the modal. Extend the stable category mapping for Home, then apply low-percentage `color-mix()` washes and perimeter borders in the existing global component styles; no new component state or dependency is required.

**Tech Stack:** Next.js 16, React 19, CSS custom properties and `color-mix()`, Node test runner, existing Dither Kit chart.

## Global Constraints

- The expense database remains read-only; this change performs no database writes.
- Add no production dependencies.
- Keep the modal shell neutral white and use only the selected category accent.
- Keep text dark and legible on every tinted surface.
- Do not add gradients, decorative motion, side accent stripes, or unrelated colors.
- Preserve keyboard focus, reduced-motion behavior, `aria-current`, and existing chart behavior.

---

### Task 1: Category-aware modal surfaces

**Files:**
- Modify: `lib/categories.js`
- Modify: `app/globals.css:617-647`
- Test: `test/transactions-ui.test.js:172-241`

**Interfaces:**
- Consumes: `categoryTone(slug: string): string` and the modal inline `--category-accent` property.
- Produces: `categoryTone("hogar") === "primary"` and category-aware modal CSS driven entirely by `--category-accent`.

- [ ] **Step 1: Write the failing regression test**

Add a source-level test after the existing category-month chart test:

```js
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
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
node --test test/transactions-ui.test.js
```

Expected: FAIL because `hogar: "primary"` and the category-aware modal style rules do not exist yet.

- [ ] **Step 3: Extend the stable Home category mapping**

Add Home beside the other household/fixed-cost mappings in `lib/categories.js`:

```js
  hogar: "primary",
```

This makes Home use the product's established navy category color rather than the muted fallback.

- [ ] **Step 4: Implement the restrained category color treatment**

Update the modal rules in `app/globals.css` to use the existing accent property:

```css
.transaction-dialog-head .label {
  color: color-mix(in srgb, var(--category-accent) 72%, var(--on-surface));
}

.transaction-dialog-close {
  transition: background .18s ease, border-color .18s ease, color .18s ease;
}

.transaction-dialog-close:hover {
  border-color: color-mix(in srgb, var(--category-accent) 40%, var(--outline));
  background: color-mix(in srgb, var(--category-accent) 8%, var(--surface-lowest));
  color: color-mix(in srgb, var(--category-accent) 70%, var(--on-surface));
}

.transaction-dialog-close:focus-visible,
.transaction-dialog-state button:focus-visible {
  outline: 2px solid var(--category-accent);
  outline-offset: 3px;
}

.transaction-detail-summary div {
  border: 1px solid color-mix(in srgb, var(--category-accent) 18%, var(--outline));
  background: color-mix(in srgb, var(--category-accent) 7%, var(--surface-lowest));
}

.transaction-detail-summary span {
  color: color-mix(in srgb, var(--category-accent) 42%, var(--on-surface));
}

.category-month-chart,
.category-month-expenses {
  border-top-color: color-mix(in srgb, var(--category-accent) 22%, var(--outline));
}

.category-month-section-head h3 {
  color: color-mix(in srgb, var(--category-accent) 52%, var(--on-surface));
}

.category-month-expense.is-selected {
  border: 1px solid color-mix(in srgb, var(--category-accent) 40%, var(--outline));
  background: color-mix(in srgb, var(--category-accent) 9%, var(--surface-lowest));
}
```

Remove the existing selected-row inset side stripe:

```css
box-shadow: inset 3px 0 var(--category-accent);
```

- [ ] **Step 5: Run focused tests and verify they pass**

Run:

```bash
node --test test/transactions-ui.test.js
```

Expected: 23 transaction UI tests pass.

- [ ] **Step 6: Run the full suite and production build**

Run:

```bash
EXPENSE_DB_PATH=/Users/yani/Dev/expenses/expenses.db pnpm test
pnpm run build
```

Expected: all tests pass and the Next.js production build succeeds. If sandboxed Turbopack fails with `binding to a port: Operation not permitted`, rerun only `pnpm run build` with the existing approved escalation.

- [ ] **Step 7: Verify category color in the browser**

Start the project with the read-only local database:

```bash
EXPENSE_DB_PATH=/Users/yani/Dev/expenses/expenses.db pnpm dev
```

Open `/transactions`, then verify:

- Home uses navy accents rather than gray.
- Technology uses cyan and Subscriptions uses violet.
- The modal shell remains white.
- Summary text remains readable and the selected expense has a full perimeter border.
- The close button hover/focus treatment uses the active category color.
- The narrow/mobile modal has no horizontal overflow.

- [ ] **Step 8: Commit the implementation**

```bash
git add lib/categories.js app/globals.css test/transactions-ui.test.js
git commit -m "feat: colorize category month modal"
```

Expected: one commit containing the category mapping, modal color treatment, and regression coverage.
