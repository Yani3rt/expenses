import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTransactionsUrl,
  categorySelectionLabel,
  normalizeCategoryValues,
  replaceCategoryParams,
  toggleCategoryValue,
  transactionsRouteIdentity,
} from "../lib/transaction-filters.js";

test("transaction URLs preserve explicit limits and repeated categories", () => {
  const url = buildTransactionsUrl({
    q: "cloud",
    period: "all",
    month: "all",
    categories: ["tecnologia", "viajes"],
    sort: "newest",
    offset: 0,
    limit: 2,
  });

  assert.equal(url, "/transactions?q=cloud&period=all&category=tecnologia&category=viajes&limit=2");
});

test("transaction URLs reset offset when clearing a filter", () => {
  assert.equal(
    buildTransactionsUrl({
      q: "cloud",
      period: "all",
      month: "all",
      categories: [],
      sort: "newest",
      offset: 20,
      limit: 10,
    }, { q: "" }),
    "/transactions?period=all",
  );
});

test("transaction URLs retain an explicit pagination offset alongside filter values", () => {
  assert.equal(
    buildTransactionsUrl({
      q: "",
      period: "all",
      month: "all",
      categories: ["viajes"],
      sort: "newest",
      offset: 20,
      limit: 10,
    }, { categories: ["tecnologia", "viajes"], offset: 30 }, "/api/transactions"),
    "/api/transactions?period=all&category=tecnologia&category=viajes&offset=30",
  );
});

test("transaction reset URL keeps the all-time period explicit", () => {
  assert.equal(buildTransactionsUrl({}, { period: "all" }), "/transactions?period=all");
});

test("raw route identity preserves request values independently of server normalization", () => {
  assert.equal(
    transactionsRouteIdentity({ month: "2026-06", category: ["missing"], limit: "300" }),
    "/transactions?period=this_month&month=2026-06&category=missing&limit=300",
  );
});

test("normalizes repeated category values", () => {
  assert.deepEqual(
    normalizeCategoryValues(["tecnologia", "viajes", "tecnologia", "all", ""]),
    ["tecnologia", "viajes"],
  );
});

test("normalizes comma-separated legacy category values", () => {
  assert.deepEqual(normalizeCategoryValues("tecnologia, viajes"), ["tecnologia", "viajes"]);
});

test("filters unknown category values against the catalog", () => {
  assert.deepEqual(
    normalizeCategoryValues(["tecnologia", "not-a-category"], ["tecnologia", "viajes"]),
    ["tecnologia"],
  );
});

test("replaces category params without disturbing other filters", () => {
  const params = new URLSearchParams("q=cloud&category=hogar");

  replaceCategoryParams(params, ["tecnologia", "viajes"]);

  assert.equal(params.toString(), "q=cloud&category=tecnologia&category=viajes");
});

test("clearing categories removes every category parameter", () => {
  const params = new URLSearchParams("category=tecnologia&category=viajes&period=this_month");

  replaceCategoryParams(params, []);

  assert.equal(params.toString(), "period=this_month");
});

test("toggles one category without disturbing the other selections", () => {
  assert.deepEqual(toggleCategoryValue(["tecnologia"], "viajes"), ["tecnologia", "viajes"]);
  assert.deepEqual(toggleCategoryValue(["tecnologia", "viajes"], "tecnologia"), ["viajes"]);
});

test("summarizes the category selection in the closed trigger", () => {
  const catalog = [
    { slug: "tecnologia", name: "Technology" },
    { slug: "viajes", name: "Travel" },
  ];

  assert.equal(categorySelectionLabel([], catalog), "All categories");
  assert.equal(categorySelectionLabel(["viajes"], catalog), "Travel");
  assert.equal(categorySelectionLabel(["tecnologia", "viajes"], catalog), "2 categories");
});
