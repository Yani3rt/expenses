# Responsive Active-Day Chart Design

## Goal

Keep the transaction modal's full calendar chart on desktop while showing only expense days on tablet and mobile.

## Design

`TransactionDetailDialog` continues to build the complete calendar-month dataset for desktop. A small client-side media-query hook tracks the project's tablet breakpoint (`max-width: 1080px`). At that breakpoint and below, the chart receives only rows whose `totalSpend` is greater than zero.

The existing Dither BarChart, tooltip, labels, animation, category color, and active-day count remain unchanged. No database or query behavior changes.

## Responsive behavior

- Above 1080px: retain every calendar date to preserve temporal spacing.
- At or below 1080px: render only dates with recorded spending.
- Recompute when the viewport crosses the breakpoint.

## Verification

Add a regression assertion for the media query and positive-total filter, run it red then green, run the complete test suite and production build against the read-only fixture database, and inspect desktop and tablet browser widths.
