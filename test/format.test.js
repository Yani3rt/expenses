import test from "node:test";
import assert from "node:assert/strict";
import { compactNumber, money, monthLabel, shortDate } from "../lib/format.js";

test("date formatting preserves SQLite date values without timezone drift", () => {
  assert.equal(monthLabel("2026-06"), "June 2026");
  assert.equal(shortDate("2026-06-26"), "Jun 26");
});

test("money and compact numbers normalize null and preserve supported currencies", () => {
  assert.equal(money(null), "$0.00");
  assert.equal(money(0), "$0.00");
  assert.equal(money(1234.5), "$1,234.50");
  assert.equal(money(1234.5, "EUR"), "€1,234.50");
  assert.equal(compactNumber(null), "0");
  assert.equal(compactNumber(1234.5), "1,235");
});
