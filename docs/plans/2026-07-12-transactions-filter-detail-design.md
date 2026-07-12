# Transactions Filter and Detail Design

## Goal

Make the Transactions page faster to scan on desktop and make ledger rows genuinely useful when opened.

## Desktop filter design

Search and the quick period presets remain visible. Month, category, and sort move into a desktop `More filters` disclosure, matching the existing mobile progressive-disclosure pattern. The button shows the number of active advanced filters. Active filter chips and URL-backed navigation remain unchanged.

## Transaction detail design

Ledger rows become accessible buttons that open a modal. The modal is useful only because it adds filter-aware context beyond the row itself. It shows the transaction's rank by amount in the current result set, share of filtered spend, difference from the filtered average, category rank, and category share. A compact comparison chart contrasts the selected amount with the filtered average and its category average.

All metrics follow the current ledger filters. For example, with `Last 3 months` active, ranks and averages use those three months. Search, month, period, and category constraints are applied consistently. Sort and pagination do not affect the metric population.

## Data flow

Opening a row requests a read-only transaction-detail API using the transaction ID and current filter state. The server validates the ID and normalized filters, reads the canonical database in read-only mode through the existing database helper, and returns the transaction plus contextual metrics. This avoids inaccurate calculations from only the currently loaded client page.

## Modal behavior

The dialog opens with a loading state, traps focus, closes with Escape or the close button, restores focus to the originating row, and prevents background interaction. If the insight request fails, the basic row data remains visible with a retry action. The modal contains three concise headline metrics and one comparison chart rather than duplicating the dashboard.

## Visual behavior

Static ledger hover translation is removed. Interactive rows receive restrained background, border, cursor, and focus-visible treatments. The active preset's broad shadow is reduced to match the flat visual system.

## Error handling

Invalid or missing transaction IDs return a clear 400/404 response. A failed client request does not close the modal or discard basic transaction data. Retry repeats the request with the same filter context.

## Testing

- Query tests cover ranks, shares, averages, category context, and month/period/search filtering.
- API tests cover valid responses, invalid IDs, missing records, and filter normalization.
- UI tests cover the desktop filter disclosure, active count, modal trigger semantics, loading, error, retry, Escape, backdrop, and focus restoration.
- Existing read-only tests continue proving that no database writes occur.

## Constraints

- Do not add production dependencies.
- The canonical expense database remains strictly read-only.
- Existing mobile filter behavior and URL-backed filter state must remain intact.

