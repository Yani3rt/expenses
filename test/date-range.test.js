import test from "node:test";
import assert from "node:assert/strict";
import { currentWeekBounds } from "../lib/date-range.js";

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
