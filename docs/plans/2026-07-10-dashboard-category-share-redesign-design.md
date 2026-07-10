# Dashboard Category Share Redesign

**Date:** 2026-07-10

## Goal

Redesign the Dashboard Category share donut so percentage composition is immediately readable, interaction remains useful, and the card no longer stretches into a large empty panel beside Category totals.

## Approved direction

- Prioritize percentage share because exact dollar totals already appear in the adjacent Category totals card.
- Preserve a circular donut visualization and category drill-down.
- Show the six largest categories plus an aggregated **Other** segment so the chart always represents 100% of spending.
- Replace the pill cloud with a compact vertical ranking.
- Keep the card at its natural height and make it sticky on desktop while the longer Category totals card scrolls.
- Stack naturally on smaller screens with no sticky positioning.
- Add no production dependencies and preserve read-only behavior.

## Interaction design

The donut center defaults to the overall state:

- `100%`
- `Total spending`
- total amount as secondary information

Hovering, focusing, or selecting a segment or ranked row changes the center to:

- category share percentage as the primary value
- category name
- exact category amount as secondary information

The ranked rows show a color marker, category name, and percentage. Real categories link to the Transactions ledger filtered by category. The aggregated Other row is informational because it represents multiple categories and cannot map to one ledger category filter.

The chart and ranking share one active state. The total state remains available through a small `All categories` control so users can return to the complete view.

## Data design

A pure helper receives category aggregates, sorts them by total spend, preserves the top six, and combines the remainder into Other. It returns:

- `totalSpend`
- chart rows with `category`, `categorySlug`, `totalSpend`, `expenseCount`, and `sharePercent`
- `isOther` for the aggregate row

Shares are calculated from the full category total and rounded for display without changing the proportional SVG circumference values. The helper handles empty input and prevents the rendered segments from exceeding the complete total.

## Layout and visual system

The card gets a normal left-aligned section header, compact chart area, and vertical ranking below it. The donut uses a thinner track, clearer active segment, and restrained surface treatment without gradients or decorative animation. Ranking rows use existing typography and color tokens.

On desktop the card uses `align-self: start` and sticky positioning below the page header. On mobile/tablet it returns to normal document flow and uses a compact two-column ranking where space permits, collapsing to one column on narrow screens.

## Verification

- Unit tests for top-six aggregation, Other, percentage calculation, and empty data.
- UI source tests for percentage-first center copy, ranking, All categories reset, filtered links, and Other behavior.
- CSS tests for natural-height sticky desktop layout and non-sticky responsive layout.
- Full Node test suite with the explicitly approved read-only project database.
- Impeccable detector, production build, and live localhost browser review.
