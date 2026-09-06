import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const categories = [
  [1, "Technology", "tecnologia"],
  [2, "Travel", "viajes"],
  [3, "Food", "comida"],
  [4, "Clothes", "clothes"],
  [5, "Rent", "alquiler"],
];

const people = [
  [1, "Yani", "yani"],
  [2, "Alex", "alex"],
];

const expenses = [
  [1, "2026-05-01", "May rent", 900, 5, 1, null],
  [2, "2026-05-08", "Groceries", 82.5, 3, 2, "Weekly shop"],
  [3, "2026-05-31", "Spring clothes", 60, 4, 1, null],
  [4, "2026-06-13", "Technology expense", 210, 1, 1, null],
  [5, "2026-06-01", "Train tickets", 45, 2, 2, null],
  [6, "2026-06-04", "Lunch", 18.25, 3, 1, null],
  [7, "2026-06-09", "Hotel deposit", 120, 2, 2, null],
  [8, "2026-06-15", "Groceries", 75.4, 3, 1, null],
  [9, "2026-06-18", "Dinner", 54.6, 3, 2, "Birthday meal"],
  [10, "2026-06-22", "Taxi", 28, 2, 1, null],
  [11, "2026-06-26", "Tech expense", 70, 1, 1, null],
  [12, "2026-06-30", "Airport transfer", 35, 2, 2, null],
  [13, "2026-07-01", "Flight change", 95, 2, 1, null],
  [14, "2026-07-03", "Breakfast", 14.5, 3, 2, null],
  [15, "2026-07-05", "Museum tickets", 32, 2, 1, null],
  [16, "2026-07-08", "Groceries", 88.75, 3, 2, null],
  [17, "2026-07-11", "Train pass", 42, 2, 1, null],
  [18, "2026-07-14", "Lunch", 21.2, 3, 2, null],
  [19, "2026-07-17", "Hotel", 140, 2, 1, null],
  [20, "2026-07-20", "Dinner", 39.8, 3, 2, null],
  [21, "2026-07-23", "Travel snacks", 16.5, 2, 1, null],
  [22, "2026-07-26", "Groceries", 71.1, 3, 2, null],
  [23, "2026-07-29", "Bus tickets", 24, 2, 1, null],
  [24, "2026-07-31", "Tech accessory", 12.99, 1, 1, null],
];

export function createExpenseFixture({ empty = false } = {}) {
  const directory = mkdtempSync(join(tmpdir(), "expense-viewer-test-"));
  const path = join(directory, "expenses.db");
  let db;

  try {
    db = new DatabaseSync(path);
    db.exec(`
      CREATE TABLE categories (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE
      );
      CREATE TABLE persons (
        id INTEGER PRIMARY KEY,
        display_name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE
      );
      CREATE TABLE expenses (
        id INTEGER PRIMARY KEY,
        expense_date TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        category_id INTEGER NOT NULL REFERENCES categories(id),
        paid_by_person_id INTEGER NOT NULL REFERENCES persons(id),
        notes TEXT
      );
      CREATE TABLE expense_allocations (
        id INTEGER PRIMARY KEY,
        expense_id INTEGER NOT NULL REFERENCES expenses(id),
        person_id INTEGER NOT NULL REFERENCES persons(id),
        percentage REAL NOT NULL
      );
      CREATE INDEX expenses_expense_date_idx ON expenses(expense_date);
    `);

    const insertCategory = db.prepare("INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)");
    const insertPerson = db.prepare("INSERT INTO persons (id, display_name, slug) VALUES (?, ?, ?)");
    const insertExpense = db.prepare(`
      INSERT INTO expenses
        (id, expense_date, description, amount, currency, category_id, paid_by_person_id, notes)
      VALUES (?, ?, ?, ?, 'USD', ?, ?, ?)
    `);
    const insertAllocation = db.prepare(`
      INSERT INTO expense_allocations (id, expense_id, person_id, percentage)
      VALUES (?, ?, ?, ?)
    `);

    if (!empty) {
      for (const row of categories) insertCategory.run(...row);
      for (const row of people) insertPerson.run(...row);
      for (const row of expenses) insertExpense.run(...row);
      insertAllocation.run(1, 1, 1, 50);
      insertAllocation.run(2, 1, 2, 50);
      insertAllocation.run(3, 4, 1, 100);
    }
    db.close();
    db = undefined;
  } catch (error) {
    try {
      db?.close();
    } catch {
      // Preserve the setup failure while still removing the fixture directory.
    }
    rmSync(directory, { recursive: true, force: true });
    throw error;
  }

  let cleaned = false;
  return {
    path,
    cleanup() {
      if (cleaned) return;
      cleaned = true;
      rmSync(directory, { recursive: true, force: true });
    },
  };
}
