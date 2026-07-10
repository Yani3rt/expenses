# Spending Category Comparison Design

**Date:** 2026-07-10

## Goal

Turn the Spending page into a genuine month-over-month category comparison while reducing repeated presentations of the same selected-month totals.

## Approved scope

- A selected month compares automatically with the immediately previous calendar month.
- The `All` option remains a historical, non-comparison view.
- Remove the existing **Spending split / Category totals** bar card.
- Remove the existing **Category share** donut card.
- Keep the detailed category cards for this iteration.
- Add no production dependencies.
- Keep all database access read-only.

## User experience

The month picker remains in the page header. For a concrete month, the summary row contains two distinct metrics: selected-month spend and total change from the previous month. The main content begins with one full-width **Category comparison** section.

Each comparison row shows the category, selected-month total, previous-month total, signed dollar change, percentage change when a previous total exists, and two proportional bars. Rows are ordered by absolute dollar change so the most meaningful movement appears first. A category that exists in only one period still appears. Selecting a row opens Transactions filtered to the selected month and category.

The detailed category cards remain below the comparison and continue to show selected-month count, average, and latest expense. They provide drill-down context that is not duplicated by the comparison rows.

The retained detail-card section has a top-left explanation so it does not look like an unlabeled continuation of the comparison:

- Label: **Selected month details**
- Heading: **Category activity**
- Supporting copy: **Counts, averages, and latest activity for {selected month}.**

For `All`, the summary retains all-time spend and average expense. The main comparison component switches to a historical breakdown mode showing category total, count, and share, without previous-period or delta columns. The detailed category cards remain below it.

## Data design

`getSpendingData()` will calculate `previousMonth` for concrete months and query category aggregates for both periods. A pure helper will merge the two category sets by slug and return:

- `category` and `categorySlug`
- `currentTotal` and `previousTotal`
- `deltaAmount` and nullable `deltaPercent`
- `direction`: `up`, `down`, `flat`, or `new`
- selected-month count, average, and latest date for the retained detail cards

The helper will also calculate the selected and previous totals plus the overall signed change. Keeping the merge logic outside SQLite makes missing-category and zero-baseline behavior easy to test without the canonical database.

## Components

- Add a focused `CategoryComparison` server component for comparison and all-time modes.
- Keep `CategoryDetailCards` unchanged except for any prop adaptation required by the new data shape.
- Remove `CategoryBars` and `Donut` only from the Spending page; the dashboard continues using them.
- Add restrained comparison styles to `app/globals.css`, including a single-column mobile layout.

## Edge cases

- No previous spending: show `$0.00`, mark current-only categories as new, and omit percentage change.
- Category disappeared: show `$0.00` for the selected month and a negative delta.
- No selected-month rows: show the comparison using previous-only categories and retain the existing empty state for detail cards.
- `All`: do not invent a previous period or display comparison language.

## Verification

- Unit tests for merging, ordering, zero baselines, missing categories, and all-time rows.
- Source/UI tests confirming the two redundant cards are removed from Spending while `CategoryDetailCards` remains.
- Query tests confirming previous-month data and comparison output are exposed.
- Focused Node test suite, Impeccable detector, production build, and live localhost smoke review using the explicitly approved read-only project database.
