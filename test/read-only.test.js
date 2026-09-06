import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { DEFAULT_DB_PATH, getDatabase } from "../lib/db.js";
import { existsSync, readFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, isAbsolute, relative } from "node:path";
import { GET as getTransactionDetail } from "../app/api/transactions/[id]/route.js";
import { createExpenseFixture, useExpenseFixture } from "../test-support/expense-fixture.js";

useExpenseFixture();

test("expense fixture replaces an invalid database path and cleans up only its temp directory", () => {
  const suiteFixturePath = process.env.EXPENSE_DB_PATH;
  process.env.EXPENSE_DB_PATH = "/definitely-not-a-real-expense-db";
  let teardown;
  let fixtureDirectory;

  try {
    const fixture = useExpenseFixture((cleanup) => { teardown = cleanup; });
    fixtureDirectory = dirname(fixture.path);
    assert.notEqual(fixture.path, "/definitely-not-a-real-expense-db");
    assert.equal(process.env.EXPENSE_DB_PATH, fixture.path);
    const fixtureRelativeToTemp = relative(tmpdir(), fixtureDirectory);
    const databaseRelativeToFixture = relative(fixtureDirectory, fixture.path);
    assert.equal(isAbsolute(fixtureRelativeToTemp), false);
    assert.doesNotMatch(fixtureRelativeToTemp, /^\.\.(?:[\\/]|$)/);
    assert.match(fixtureRelativeToTemp, /^expense-viewer-test-/);
    assert.equal(isAbsolute(databaseRelativeToFixture), false);
    assert.doesNotMatch(databaseRelativeToFixture, /^\.\.(?:[\\/]|$)/);

    const db = getDatabase();
    try {
      assert.ok(db.prepare("SELECT COUNT(*) AS count FROM expenses").get().count > 0);
    } finally {
      db.close();
    }
    teardown();
    teardown = undefined;

    assert.equal(process.env.EXPENSE_DB_PATH, "/definitely-not-a-real-expense-db");
    assert.equal(existsSync(fixtureDirectory), false);
    assert.equal(existsSync(suiteFixturePath), true);
  } finally {
    teardown?.();
    process.env.EXPENSE_DB_PATH = suiteFixturePath;
  }
});

test("expense fixture removes its new temp directory when setup fails", (t) => {
  let ownedDatabasePath;
  t.mock.method(DatabaseSync.prototype, "exec", function failFixtureSetup() {
    ownedDatabasePath = this.prepare("PRAGMA database_list")
      .all()
      .find((database) => database.name === "main")?.file;
    throw new Error("synthetic fixture setup failure");
  });

  assert.throws(() => createExpenseFixture(), /synthetic fixture setup failure/);

  assert.equal(typeof ownedDatabasePath, "string");
  assert.equal(existsSync(dirname(ownedDatabasePath)), false);
});

test("default database path follows the current user's home directory", () => {
  const separator = process.platform === "win32" ? "\\" : "/";
  assert.equal(
    DEFAULT_DB_PATH,
    [homedir().replace(/[\\/]$/, ""), ".hermes", "expense-tracker", "expenses.db"].join(separator),
  );
});

test("database connection is read-only and rejects writes", () => {
  const db = getDatabase();
  try {
    const count = db.prepare("SELECT COUNT(*) AS count FROM expenses").get().count;
    assert.equal(typeof count, "number");
    assert.throws(
      () => db.exec("CREATE TABLE __expense_viewer_write_guard(id INTEGER)"),
      /readonly|query only|attempt to write/i
    );
    const created = db.prepare(`
      SELECT COUNT(*) AS count
      FROM sqlite_master
      WHERE type = 'table' AND name = '__expense_viewer_write_guard'
    `).get().count;
    assert.equal(created, 0);
  } finally {
    db.close();
  }
});

for (const [label, id] of [
  ["zero", "0"],
  ["negative", "-1"],
  ["decimal", "1.5"],
  ["empty", ""],
  ["non-digit", "not-a-number"],
  ["larger than Number.MAX_SAFE_INTEGER", "9007199254740992"],
]) {
  test(`transaction detail route rejects ${label} IDs`, async () => {
    const response = await getTransactionDetail(
      new Request(`http://localhost/api/transactions/${id}`),
      { params: Promise.resolve({ id }) },
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Transaction ID must be a positive integer." });
  });
}

test("transaction detail route returns missing records as 404", async () => {
  const response = await getTransactionDetail(
    new Request("http://localhost/api/transactions/999999?q=tech&period=last_month&month=all&category=tecnologia"),
    { params: Promise.resolve({ id: "999999" }) },
  );

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Transaction not found." });
});

test("transaction detail route returns detail from read-only queries", async () => {
  const response = await getTransactionDetail(
    new Request("http://localhost/api/transactions/4?q=tech&period=all&month=all&category=all"),
    { params: Promise.resolve({ id: "4" }) },
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.transaction.id, 4);
  assert.equal(payload.categoryMonth.month, "2026-06");
  assert.equal(payload.categoryMonth.categorySlug, "tecnologia");
  assert.equal(payload.categoryMonth.expenseCount, 2);
});

test("transaction detail route only delegates data access to the read-only query layer", () => {
  const source = readFileSync(
    new URL("../app/api/transactions/[id]/route.js", import.meta.url),
    "utf8",
  );

  assert.match(source, /getTransactionDetailData/);
  assert.match(source, /Number\.isSafeInteger/);
  assert.match(source, /\^\\d\+\$/);
  assert.doesNotMatch(source, /searchParams/);
  assert.doesNotMatch(source, /(?:INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER|VACUUM|REINDEX)\b/i);
  assert.doesNotMatch(source, /(?:getDatabase|withDatabase|node:sqlite|\.prepare\s*\()/);
});
