import test from "node:test";
import assert from "node:assert/strict";
import { monthLabel, shortDate } from "../lib/format.js";

test("date formatting preserves SQLite date values without timezone drift", () => {
  assert.equal(monthLabel("2026-06"), "June 2026");
  assert.equal(shortDate("2026-06-26"), "Jun 26");
});
