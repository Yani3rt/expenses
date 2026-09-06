import test from "node:test";
import assert from "node:assert/strict";
import { currentWeekBounds, monthBounds } from "../lib/date-range.js";

test("current week uses Monday through Sunday", () => {
  assert.deepEqual(currentWeekBounds(new Date("2026-07-11T12:00:00")), {
    start: "2026-07-06",
    end: "2026-07-12",
  });
});

test("Monday and Sunday remain inside their calendar week", () => {
  assert.deepEqual(currentWeekBounds(new Date("2026-07-06T12:00:00")), {
    start: "2026-07-06",
    end: "2026-07-12",
  });
  assert.deepEqual(currentWeekBounds(new Date("2026-07-12T12:00:00")), {
    start: "2026-07-06",
    end: "2026-07-12",
  });
});

test("month bounds use an exclusive next-month boundary across calendar edges", () => {
  assert.deepEqual(monthBounds("2026-06"), { from: "2026-06-01", to: "2026-07-01" });
  assert.deepEqual(monthBounds("2026-12"), { from: "2026-12-01", to: "2027-01-01" });
  assert.deepEqual(monthBounds("2024-02"), { from: "2024-02-01", to: "2024-03-01" });
});
