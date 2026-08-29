import { DatabaseSync } from "node:sqlite";
import { existsSync, statSync } from "node:fs";
import { homedir } from "node:os";

const pathSeparator = process.platform === "win32" ? "\\" : "/";
export const DEFAULT_DB_PATH = [
  homedir().replace(/[\\/]$/, ""),
  ".hermes",
  "expense-tracker",
  "expenses.db",
].join(pathSeparator);

export function getExpenseDbPath() {
  return process.env.EXPENSE_DB_PATH || DEFAULT_DB_PATH;
}

export function getDatabase() {
  const path = getExpenseDbPath();
  if (!existsSync(path)) {
    throw new Error(`Expense database not found: ${path}`);
  }

  const db = new DatabaseSync(path, { readOnly: true });
  db.exec("PRAGMA query_only = ON");
  return db;
}

export function withDatabase(fn) {
  const db = getDatabase();
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

export function getDatabaseStatus() {
  const path = getExpenseDbPath();
  const exists = existsSync(path);
  const stat = exists ? statSync(path) : null;
  return {
    path,
    exists,
    readonly: true,
    sizeBytes: stat?.size ?? 0,
    modifiedAt: stat ? stat.mtime.toISOString() : null,
  };
}
