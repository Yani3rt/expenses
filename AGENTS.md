# AGENTS.md — expense-viewer

## Project scope

`expense-viewer` is a read-only viewer for the existing expense-tracker database.

## Database

By default, the viewer reads the Hermes Expense Tracker database from the
current user's home directory:

```bash
$HOME/.hermes/expense-tracker/expenses.db
```

Set `EXPENSE_DB_PATH` when the database lives somewhere else.

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
from pathlib import Path

DEFAULT_DB_PATH = Path.home() / ".hermes" / "expense-tracker" / "expenses.db"
DB_PATH = Path(os.environ.get("EXPENSE_DB_PATH", DEFAULT_DB_PATH))
conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
```

When using the SQLite CLI, use read-only mode:

```bash
DB_PATH="${EXPENSE_DB_PATH:-$HOME/.hermes/expense-tracker/expenses.db}"
sqlite3 -readonly "$DB_PATH"
```

Do not use plain `sqlite3.connect(DB_PATH)` for this project because SQLite may open the file in read-write mode by default.

## If writes are ever requested

Stop and ask for explicit approval. Any write/migration/repair work belongs in the owning expense-tracker project scope, not inside `expense-viewer`.
