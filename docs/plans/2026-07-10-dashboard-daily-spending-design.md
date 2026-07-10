# Dashboard Daily Spending Design

**Date:** 2026-07-10

## Goal

Rebalance the dashboard around recent activity and current-month daily behavior while removing the redundant Category totals and lower Recent expenses cards.

## Approved layout

1. Keep the three metrics and What changed summary.
2. First dashboard row:
   - **Recent spending** on the left with the 10 latest transactions.
   - **Category share** on the right with the redesigned donut.
3. Keep **Monthly trend** full width.
4. Final dashboard row:
   - **Daily spending** on the left.
   - **Largest expenses** on the right.
5. Remove the old Category totals card and the duplicate lower Recent expenses card.

## Category share adjustment

The donut center remains percentage-first because it communicates composition. The vertical ranking changes its right-hand value from percentage to exact dollar amount so it complements the center and supports quick comparison with transaction amounts.

## Recent spending

Reuse the existing ExpenseList presentation and show the 10 latest transactions. Keep the Open ledger action. The card participates in the same bounded category row as the sticky share card, so the share card stops before Monthly trend.

## Daily spending

The chart includes only dates in the current month that contain expenses. It must be labeled as spending days so users do not interpret missing dates as missing data.

Each vertical bar shows:

- daily total above the bar
- abbreviated date below it
- height relative to the highest spending day

The card also summarizes:

- number of spending days
- average per spending day
- highest-spend date and amount

The bars scroll horizontally when necessary. The chart is read-only and does not invent zero-value days.

## Data design

`getDashboardData()` will query current-month daily aggregates grouped by `expense_date`, ordered ascending. It will return `dailyTotals` and expand `recentExpenses` from six to ten rows. Existing read-only database access remains unchanged.

## Responsive behavior

On desktop, Recent spending and Category share use the existing 7/5 split. Daily spending and Largest expenses use a 6/6 split. At the existing mobile breakpoint all four cards stack to one column. The daily bar rail keeps horizontal overflow inside the card.

## Verification

- Query/source tests for grouped active-month daily totals and 10 recent rows.
- UI tests for the new layout order, removed duplicates, dollar share ranking, and daily-chart semantics.
- Responsive CSS tests for chart overflow and stacked cards.
- Detector, full test suite against the approved read-only project database, production build, and running-server review.
