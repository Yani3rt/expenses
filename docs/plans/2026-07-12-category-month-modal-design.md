# Category-Month Transaction Modal Design

## Goal

Turn the transaction modal into a useful read-only drilldown for the selected transaction's category in its calendar month.

## Scope

The server derives both category and month from the selected transaction ID. Page filters, sorting, pagination, and search do not affect modal data.

## Content

The modal header identifies the category and month while retaining the selected transaction title. Four cards show category total, transaction count, average expense, and change from the previous month. When the prior month has no matching category spend, the change card reads “New this month.”

A compact daily-spending bar chart shows only active days for that category and month. Bars encode daily totals, expose date/total/count as accessible text, and highlight the selected transaction's day with the category accent.

The bottom section lists every same-category expense in the month, newest first, showing description, date, payer, and amount. The selected expense is highlighted. The existing modal remains scrollable.

## Data flow

`GET /api/transactions/:id` returns the selected transaction plus a `categoryMonth` object containing month/category metadata, aggregate metrics, previous-month comparison, daily totals, and matching expenses. The endpoint remains read-only and accepts no filter context.

## Interaction and accessibility

The existing focus trap, Escape/backdrop/close behavior, focus restoration, loading/error/retry states, and reduced-motion handling remain. Bars and list rows expose their data semantically; visual bars are decorative.

## Testing

Query tests cover month/category derivation, totals, previous-month fallback, daily grouping, ordering, and missing IDs. Client/API tests validate the new contract. UI tests cover the new cards, chart semantics, list, selected state, and removal of obsolete filtered-ranking content.

