# expense-viewer

Read-only expense dashboard served over the Tailnet.

## URL

```text
http://fedora.tailebea04.ts.net:8788
```

## Run

```bash
EXPENSE_DB_PATH=/home/zero/.hermes/expense-tracker/expenses.db npm start
```

The app binds to `0.0.0.0:8788` so it is reachable from Tailscale.

## Development

```bash
npm install
npm test
npm run build
npm run dev
```

## Read-only database rule

The dashboard opens the SQLite database with Node's `DatabaseSync` using `{ readOnly: true }` and also sets `PRAGMA query_only = ON` for the connection. API routes expose only `GET`; `POST` requests return `405`.

The canonical DB path is:

```bash
/home/zero/.hermes/expense-tracker/expenses.db
```
