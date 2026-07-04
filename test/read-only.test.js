import test from "node:test";
import assert from "node:assert/strict";
import { getDatabase } from "../lib/db.js";

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
