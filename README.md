# Expense Viewer

A polished, read-only dashboard for exploring household expense data collected by [Hermes Expense Tracker](https://github.com/Canopix/hermes-expense-tracker).

Expense Viewer does not create or own expense data. Hermes Expense Tracker remains the source of truth; this web app opens its SQLite database in read-only mode and turns the records into searchable transactions, spending summaries, comparisons, and charts.

## Features

- Spending dashboard with monthly and daily trends
- Searchable, filterable transaction ledger
- Category comparisons and transaction details
- Household payer and allocation summaries
- Database freshness and status view
- Responsive desktop and mobile layouts

## Requirements

- A database created by [Hermes Expense Tracker](https://github.com/Canopix/hermes-expense-tracker)
- Node.js 22.13.0 or newer and [pnpm](https://pnpm.io/)

## Quick start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:8788](http://localhost:8788).

By default, the viewer looks for the database at:

```text
~/.hermes/expense-tracker/expenses.db
```

If your Hermes profile stores it elsewhere, copy the example environment file and set an absolute path:

```bash
cp .env.example .env.local
```

```dotenv
EXPENSE_DB_PATH=/path/to/.hermes/expense-tracker/expenses.db
```

## Production

```bash
pnpm build
pnpm start
```

The server listens on `0.0.0.0:8788`. Keep it behind a trusted private network, authenticated proxy, or another access-control layer when using real household data.

## Read-only guarantee

The application opens SQLite with Node's `DatabaseSync` using `{ readOnly: true }` and then enables `PRAGMA query_only = ON`. Application routes expose reads only; there are no expense editing or database migration workflows in this project.

The database remains owned by Hermes Expense Tracker and must never be migrated, repaired, replaced, or otherwise modified by Expense Viewer.

## Development

```bash
pnpm test
pnpm test:browser
pnpm run build
```

Database-backed tests create deterministic SQLite fixtures in new temporary directories and set `EXPENSE_DB_PATH` to those fixtures before running queries. They never read the configured Hermes database or a database file in the checkout, and each fixture restores the previous environment value and removes its own temporary directory after the test file completes.

The browser suite requires Google Chrome. It owns a dedicated port, isolated Next.js build directory, and disposable SQLite fixture; it never connects to an existing server. Playwright starts and stops that server automatically.

Local databases, environment files, build output, and logs are excluded from version control.

## Spending workspace

The dark-first home view combines period totals, a spending trend, category filters, transactions, and payer/allocation breakdowns. `1M` shows the selected calendar month (the current month through today by default) and compares against the full previous month. Daily average uses the number of days displayed. `3M` includes the selected month and the two preceding calendar months, through today for the current month, and compares against the preceding three full calendar months. Previous/next controls browse adjacent one- or three-month blocks, and picking a date selects the ending month. `1W` and `1Y` remain trailing windows of 7 and 365 days, with the date field setting their end date. The displayed dates are authoritative. `All` includes every recorded expense.

The comparison uses the immediately preceding equally sized window. Currency selection keeps unlike currencies out of the same total. Category and search filters narrow the ledger without changing the period overview. Full transaction details remain available, and deeper views are accessible through More.

The default range ends today. If your database contains only older data, choose **Latest activity** rather than treating the latest recorded month as the present.

To preview this worktree alongside another checkout:

```bash
EXPENSE_DB_PATH=/absolute/path/to/expenses.db pnpm exec next dev -H 127.0.0.1 -p 8789
```

The database is still opened read-only. Do not copy or modify the database to preview a design.
