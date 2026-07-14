# Transactions Category Multiselect Design

## Goal

Replace the single category selector on `/transactions` with a compact, non-native multiselect that lets a household filter the ledger by any number of categories without adding production dependencies.

## Interaction

- The closed trigger reads `All categories` when no category is selected, the category name when exactly one is selected, and `<count> categories` when multiple are selected.
- Opening the trigger shows `All categories` first, followed by every category name in the existing catalog order.
- `All categories` clears individual selections. Selecting a category while all categories is active begins a category-specific selection.
- Category rows act as checkboxes and apply changes immediately. Multiple categories use OR semantics.
- The panel closes on Escape, outside pointer interaction, or a second trigger press. The trigger exposes expanded state and the panel has an accessible label.
- Each selected category receives its own removable active-filter chip. `Clear all` returns to the unfiltered category state.

## Data Flow

The canonical URL uses repeated parameters, for example `?category=food&category=travel`. Page and API entry points read all category values, normalize invalid/default values, and pass a string array to `getTransactionsData`. The query layer creates named SQLite placeholders and an `IN (...)` predicate, keeping the database strictly read-only.

Pagination carries the repeated category parameters into `/api/transactions`. Changing any category resets the ledger offset, just like the current single-category filter.

## Component Structure

`TransactionsFilters.js` owns the dropdown's open state, focus handling, immediate URL navigation, and trigger copy. Small category normalization and URL helpers live in `lib/transaction-filters.js` so Node tests can exercise behavior without rendering React.

The control reuses the existing filter-card layout and visual tokens. New CSS only covers the trigger, anchored panel, checkbox rows, and responsive sizing.

## Error and Edge Cases

- Empty, duplicate, and `all` values normalize to an empty selection.
- Unknown slugs are ignored against the category catalog before SQL is assembled.
- A URL containing one valid and one invalid slug filters by the valid category.
- If every slug is invalid, category filtering is omitted.
- Query search, date filters, sort, summaries, load-more, and transaction detail behavior remain unchanged.

## Verification

- Unit tests cover normalization, repeated URL serialization, category removal, SQL OR behavior, and metadata.
- Existing transaction tests verify search, periods, sorting, and pagination remain intact.
- The full Node test suite and production Next.js build must pass.
- Browser verification checks selection of two categories, separate active chips, filtered rows, URL persistence, category removal, `All categories`, keyboard Escape, and responsive layout.

