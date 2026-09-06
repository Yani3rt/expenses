import test from "node:test";
import assert from "node:assert/strict";
import { resolveWorkspaceRange, workspaceUrl } from "../lib/workspace-range.js";

const NOW = new Date("2026-07-31T23:30:00-04:00");

test("resolves inclusive trailing windows as half-open date-only ranges", () => {
  const cases = [
    ["1w", "2026-07-25", "2026-08-01", "2026-07-18", 7],
    ["1m", "2026-07-02", "2026-08-01", "2026-06-02", 30],
    ["3m", "2026-05-03", "2026-08-01", "2026-02-02", 90],
    ["1y", "2025-08-01", "2026-08-01", "2024-08-01", 365],
  ];

  for (const [range, from, to, previousFrom, days] of cases) {
    assert.deepEqual(resolveWorkspaceRange({ range, end: "2026-07-31" }, NOW), {
      range,
      end: "2026-07-31",
      from,
      to,
      previousFrom,
      previousTo: from,
      days,
      label: range === "1y" ? "Aug 1, 2025 – Jul 31, 2026" : `${from === "2026-07-25" ? "Jul 25" : from === "2026-07-02" ? "Jul 2" : "May 3"} – Jul 31, 2026`,
    });
  }
});

test("uses UTC date arithmetic across leap, month, year, and DST boundaries", () => {
  assert.deepEqual(
    resolveWorkspaceRange({ range: "1w", end: "2024-03-01" }, new Date("2026-01-01T12:00:00Z")),
    {
      range: "1w", end: "2024-03-01", from: "2024-02-24", to: "2024-03-02",
      previousFrom: "2024-02-17", previousTo: "2024-02-24", days: 7,
      label: "Feb 24 – Mar 1, 2024",
    },
  );
  assert.equal(resolveWorkspaceRange({ range: "1w", end: "2026-03-09" }, new Date("2026-03-10T01:00:00-04:00")).from, "2026-03-03");
  assert.equal(resolveWorkspaceRange({ range: "1w", end: "2025-01-02" }, new Date("2026-01-01T12:00:00Z")).from, "2024-12-27");
});

test("normalizes invalid ranges and dates and clamps future end dates to today", () => {
  const fallback = resolveWorkspaceRange({ range: "bogus", end: "2026-02-30" }, NOW);
  assert.equal(fallback.range, "1m");
  assert.equal(fallback.end, "2026-07-31");
  assert.equal(resolveWorkspaceRange({ range: "1w", end: "2099-01-01" }, NOW).end, "2026-07-31");
});

test("All has no synthetic bounds or prior comparison", () => {
  assert.deepEqual(resolveWorkspaceRange({ range: "all", end: "2026-07-31" }, NOW), {
    range: "all", end: "2026-07-31", from: null, to: null,
    previousFrom: null, previousTo: null, days: null, label: "All time",
  });
});

test("workspace URLs round-trip explicit state and omit empty defaults", () => {
  const url = workspaceUrl({
    range: "1w", end: "2026-07-31", currency: "EUR", q: "coffee & tea",
    category: "comida", sort: "highest", offset: 20,
  });
  const params = new URL(url, "http://local").searchParams;
  assert.equal(url.startsWith("/?"), true);
  assert.deepEqual(Object.fromEntries(params), {
    range: "1w", end: "2026-07-31", currency: "EUR", q: "coffee & tea",
    category: "comida", sort: "highest", offset: "20",
  });
  assert.equal(workspaceUrl({ range: "1m", end: "2026-07-31", q: "", category: "all", sort: "newest", offset: 0 }), "/?range=1m&end=2026-07-31");
});

test("workspace URLs omit unsafe and non-integer offsets", () => {
  assert.equal(workspaceUrl({ range: "1m", end: "2026-07-31", offset: "999999999999999999999999" }), "/?range=1m&end=2026-07-31");
  assert.equal(workspaceUrl({ range: "1m", end: "2026-07-31", offset: "2.5" }), "/?range=1m&end=2026-07-31");
});
