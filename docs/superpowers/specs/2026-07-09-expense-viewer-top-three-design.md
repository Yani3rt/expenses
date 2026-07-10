# Expense Viewer Top-Three Improvements Design

## Goal

Make the expense viewer answer “What changed and why?” immediately, align its visual language with the confirmed household product strategy, and make asynchronous/database failures understandable and recoverable.

## Scope

This change delivers three improvements:

1. A period-explicit dashboard comparison between the latest expense month and the month immediately before it.
2. A quieter visual system that removes generic fintech decoration while preserving clarity, category color, and responsive structure.
3. Loading, failure, and retry states for route data and transaction pagination/filtering.

## Non-goals

- No database writes, migrations, indexes, or schema changes.
- No authentication, budgeting, editing, export, saved views, or global search shortcut.
- No broad SQLite connection refactor beyond what is necessary to compute the comparison safely.
- No new production dependency.
- No formal accessibility program; existing inexpensive semantic and reduced-motion safeguards remain intact.

## Dashboard Comparison

### Data contract

`getDashboardData()` will return a `comparison` object alongside the existing overview data:

```js
{
  currentMonth: "2026-06",
  previousMonth: "2026-05",
  currentTotal: 4200,
  previousTotal: 3780,
  deltaAmount: 420,
  deltaPercent: 11.11,
  direction: "up",
  primaryDriver: {
    category: "Food",
    categorySlug: "comida",
    deltaAmount: 290
  },
  offsetDriver: {
    category: "Transport",
    categorySlug: "transporte",
    deltaAmount: -80
  }
}
```

When the previous month has no spending, `deltaPercent` is `null`; copy will describe the previous month as having no recorded expenses rather than presenting an infinite percentage. When no current month exists, the dashboard keeps its existing empty-safe values and the comparison summary explains that there is not enough data to compare.

Category drivers are derived by aggregating both months by category, treating missing categories as zero, then sorting signed deltas. `primaryDriver` is the largest positive delta. `offsetDriver` is the most negative delta when one exists.

### Presentation

The dashboard will lead with three period-consistent summary metrics:

1. **Month spend** — latest-month total and expense count.
2. **Change from previous month** — signed currency delta and percentage when defined.
3. **Largest expense this month** — the largest expense filtered to the active month.

A compact, non-card `ChangeSummary` region immediately below the metrics will produce deterministic household-friendly copy:

- Up: “Spending rose $420 (11%) from May. Food drove most of the increase, while Transport fell $80.”
- Down: “Spending fell $420 (11%) from May. Groceries accounted for the largest drop.”
- Flat: “Spending was about the same as May.”
- Missing comparison: “June is the first month with recorded spending, so there is no prior month to compare yet.”

The summary includes a link to the Transactions page for investigation. Lifetime totals remain available on Status instead of competing with the current-period story.

## Visual-System Reconciliation

`DESIGN.md` will be updated to describe the confirmed household audience and restrained product register. The implementation will preserve the existing palette and responsive layout while applying these rules:

- Standard content radius: 14px; compact controls may use 10–12px; pills remain fully rounded.
- Static cards use a subtle border or a tight shadow, not both as decoration.
- Static cards do not lift on hover.
- Category color is reserved for data marks, icons, and selected states.
- Universal page/card entrance sequences and looping decorative glows are removed.
- Functional transitions remain 150–220ms and communicate navigation, filtering, loading, selection, or drawer state.
- Tiny uppercase mono labels are reduced in frequency; meaningful section headings carry hierarchy.
- Existing mobile structural behavior remains unchanged except that Spending and Transactions retain compact route titles.

## Loading and Recovery

### Route states

- `app/loading.js` will render a lightweight shell with a heading placeholder and three summary placeholders.
- `app/error.js` will be a client component that explains the source could not be read, reassures the user that no data was changed, and offers `Try again` through Next’s `reset()` callback.

### Filtering state

`TransactionsFilters` will wrap router navigation in `useTransition`. While pending, the search/filter shell will expose a visible “Updating results…” status and set `aria-busy="true"`. Existing results remain visible until navigation completes.

### Pagination state

A pure client helper will own the fetch/parse contract for the next transaction page. `TransactionsLedger` will:

- Disable duplicate requests while loading.
- Clear a previous error before retrying.
- Show an inline error message when the request fails.
- Keep already loaded transactions visible.
- Provide a `Try again` button that retries the same offset and filters.
- Clear its timeout on unmount.

## Testing Strategy

Tests will be written before production changes.

1. Pure unit tests for monthly/category comparison math, including increase, decrease, missing previous month, and missing category cases.
2. Query/source integration assertions that the largest dashboard expense is scoped to the active month and the comparison data is exposed.
3. Pure unit tests for pagination response handling, including non-OK responses and malformed payloads.
4. UI source assertions for route loading/error files, filter pending state, retry state, compact mobile titles, and removal of universal decorative motion.
5. Full `pnpm test` with the canonical DB if available; otherwise report database-dependent failures separately from DB-independent results.
6. `pnpm run build` as the production compilation gate.

## Success Criteria

- A user can identify whether spending rose or fell and the main category driver without interpreting multiple charts.
- Every dashboard headline metric clearly refers to the latest month.
- Static surfaces no longer imply clickability through hover lift.
- Filtering visibly reports progress.
- Pagination failure preserves data and offers retry.
- Database-route failure produces a calm recovery screen.
- No real database writes occur, and no production dependency is added.
