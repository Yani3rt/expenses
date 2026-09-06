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
