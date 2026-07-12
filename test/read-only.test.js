import test from "node:test";
import assert from "node:assert/strict";
import { getDatabase } from "../lib/db.js";
import { readFileSync } from "node:fs";
import { GET as getTransactionDetail } from "../app/api/transactions/[id]/route.js";

test("database connection is read-only and rejects writes", () => {
  const db = getDatabase();
  try {
    const count = db.prepare("SELECT COUNT(*) AS count FROM expenses").get().count;
    assert.equal(typeof count, "number");
    assert.throws(
      () => db.exec("CREATE TABLE __expense_viewer_write_guard(id INTEGER)"),
      /readonly|query only|attempt to write/i
    );
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
  assert.equal(payload.context.resultCount, 2);
});

test("transaction detail route only delegates data access to the read-only query layer", () => {
  const source = readFileSync(
    new URL("../app/api/transactions/[id]/route.js", import.meta.url),
    "utf8",
  );

  assert.match(source, /getTransactionDetailData/);
  assert.match(source, /Number\.isSafeInteger/);
  assert.match(source, /\^\\d\+\$/);
  assert.doesNotMatch(source, /(?:INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER|VACUUM|REINDEX)\b/i);
  assert.doesNotMatch(source, /(?:getDatabase|withDatabase|node:sqlite|\.prepare\s*\()/);
});
