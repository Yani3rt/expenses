# Public README and Portable Paths Design

## Goal

Prepare the current tracked repository for public visibility by removing user-specific hostnames and absolute filesystem paths while making the README useful to new users of Hermes Expense Tracker.

## Approach

- Replace the private Tailnet hostname with localhost-based examples.
- Replace tracked `/home/zero/...` and `/Users/yani/...` paths with portable examples.
- Derive the application's default database path from the current user's home directory so the existing zero-configuration behavior remains useful across machines.
- Keep `EXPENSE_DB_PATH` as the explicit override.
- Rewrite the README around the relationship with [Hermes Expense Tracker](https://github.com/Canopix/hermes-expense-tracker), installation, configuration, development, and the read-only guarantee.

## Files and behavior

- `lib/db.js` will use `homedir()` to build `.hermes/expense-tracker/expenses.db` without embedding a username.
- `.env.example` and `AGENTS.md` will use portable home-relative examples.
- Historical tracked reports and plans will replace personal absolute paths with `$HOME`-based examples.
- `README.md` will use `pnpm`, localhost URLs, and a concise public-facing structure.

## Verification

- Run the database and query tests against the ignored local fixture.
- Run the full test suite.
- Search every tracked file for the removed Tailnet hostname and personal absolute path prefixes.
- Confirm the Hermes Expense Tracker repository link appears in the README.
