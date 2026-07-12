# Category-Month Transaction Modal Implementation Plan

**Goal:** Replace filter-relative transaction insight with a category-in-selected-month digest.

**Architecture:** Derive scope from the selected transaction on the server, return one read-only aggregate payload, and reuse the current accessible dialog shell for category-month cards, daily bars, and the matching expense list.

**Constraints:** No new dependencies. Never mutate the canonical database. Ignore page filters for modal data. Preserve focus behavior and reduced motion.

## Task 1: Category-month query

- Add failing fixture-backed tests in `test/queries.test.js`.
- Replace the filter-aware detail query in `lib/queries.js` with ID-derived category/month aggregation.
- Return selected transaction, totals, average, previous-month comparison, daily totals, and newest-first expenses.
- Run focused query tests.

## Task 2: API and client contract

- Add failing route/client tests for the new payload and filter-independent URL.
- Update `app/api/transactions/[id]/route.js`, `lib/transactions-client.js`, and `components/TransactionsLedger.js`.
- Preserve validation, abort behavior, 400/404 handling, and read-only delegation.
- Run focused API/client tests.

## Task 3: Modal redesign

- Add failing UI tests for four cards, daily chart semantics, selected-day accent, expense list, and selected expense state.
- Update `components/TransactionDetailDialog.js` and `app/globals.css`.
- Remove obsolete filtered-ranking and comparison content.
- Run focused UI and dialog behavior tests.

## Task 4: Verification

- Run the complete test suite with the local read-only fixture.
- Run the production build.
- Verify the modal live at desktop and mobile widths.

