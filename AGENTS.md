# AGENTS.md — expense-viewer

## Project scope

`expense-viewer` is a read-only viewer for the existing expense-tracker database.

## Database

Use this database path exactly:

```bash
EXPENSE_DB_PATH=/home/zero/.hermes/expense-tracker/expenses.db
```

The database is external to this project and must be treated as canonical source data owned by the expense-tracker system.

## Critical rule: database is READ-ONLY from this project

This project must never write to, migrate, repair, compact, delete, replace, chmod, chown, or otherwise mutate the real database at `$EXPENSE_DB_PATH`.

Allowed:

- Read-only SELECT queries.
- Schema inspection that does not modify the DB.
- Opening SQLite with explicit read-only mode.
- Tests against fixtures, temp databases, or disposable copies only.

Forbidden against the real DB:

- `INSERT`, `UPDATE`, `DELETE`, `REPLACE`
- `CREATE`, `DROP`, `ALTER`, migrations
- `VACUUM`, `REINDEX`, repair/cleanup scripts
- write-oriented PRAGMAs, including `PRAGMA writable_schema`
- copying over, truncating, chmod/chown, or moving the DB file

## Required SQLite access pattern

When using Python `sqlite3`, open the database with a read-only URI:

```python
import os
import sqlite3

DB_PATH = os.environ.get("EXPENSE_DB_PATH", "/home/zero/.hermes/expense-tracker/expenses.db")
conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
```

When using the SQLite CLI, use read-only mode:

```bash
sqlite3 -readonly "$EXPENSE_DB_PATH"
```

Do not use plain `sqlite3.connect(DB_PATH)` for this project because SQLite may open the file in read-write mode by default.

## If writes are ever requested

Stop and ask for explicit approval. Any write/migration/repair work belongs in the owning expense-tracker project scope, not inside `expense-viewer`.
