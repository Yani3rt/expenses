import test from "node:test";
import assert from "node:assert/strict";
import { resolveWorkspaceRange, workspaceUrl } from "../lib/workspace-range.js";

const NOW = new Date("2026-07-31T23:30:00-04:00");

test("resolves inclusive trailing windows as half-open date-only ranges", () => {
  const cases = [
    ["1w", "2026-07-25", "2026-08-01", "2026-07-18", 7],
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
      label: range === "1y" ? "Aug 1, 2025 – Jul 31, 2026" : "Jul 25 – Jul 31, 2026",
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

test("1M uses month-to-date and compares the full preceding calendar month", () => {
  assert.deepEqual(resolveWorkspaceRange({}, new Date(2026, 9, 6, 12)), {
    range: "1m", end: "2026-10-06", from: "2026-10-01", to: "2026-10-07",
    previousFrom: "2026-09-01", previousTo: "2026-10-01", days: 6,
    label: "Oct 1 – Oct 6, 2026",
  });
});

test("1M resolves historical months in full including leap years and year rollover", () => {
  for (const [end, from, to, previousFrom, days] of [
    ["2024-02-10", "2024-02-01", "2024-03-01", "2024-01-01", 29],
    ["2025-02-28", "2025-02-01", "2025-03-01", "2025-01-01", 28],
    ["2026-01-01", "2026-01-01", "2026-02-01", "2025-12-01", 31],
  ]) {
    const result = resolveWorkspaceRange({ range: "1m", end }, new Date(2026, 9, 6, 12));
    assert.equal(result.from, from);
    assert.equal(result.to, to);
    assert.equal(result.previousFrom, previousFrom);
    assert.equal(result.previousTo, from);
    assert.equal(result.days, days);
    assert.equal(Number(result.end.slice(-2)), days);
  }
});

test("3M uses two complete months plus the current month to date", () => {
  assert.deepEqual(resolveWorkspaceRange({ range: "3m" }, new Date(2026, 9, 6, 12)), {
    range: "3m", end: "2026-10-06", from: "2026-08-01", to: "2026-10-07",
    previousFrom: "2026-05-01", previousTo: "2026-08-01", days: 67,
    label: "Aug 1 – Oct 6, 2026",
  });
});

test("3M handles full historical months, leap days, and year boundaries", () => {
  for (const [end, from, to, previousFrom, days] of [
    ["2026-07-15", "2026-05-01", "2026-08-01", "2026-02-01", 92],
    ["2024-02-10", "2023-12-01", "2024-03-01", "2023-09-01", 91],
    ["2025-02-10", "2024-12-01", "2025-03-01", "2024-09-01", 90],
    ["2026-01-01", "2025-11-01", "2026-02-01", "2025-08-01", 92],
  ]) {
    const result = resolveWorkspaceRange({ range: "3m", end }, new Date(2026, 9, 6, 12));
    assert.equal(result.from, from);
    assert.equal(result.to, to);
    assert.equal(result.previousFrom, previousFrom);
    assert.equal(result.previousTo, from);
    assert.equal(result.days, days);
  }
});
