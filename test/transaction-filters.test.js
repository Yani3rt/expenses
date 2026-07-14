import test from "node:test";
import assert from "node:assert/strict";
import {
  categorySelectionLabel,
  normalizeCategoryValues,
  replaceCategoryParams,
  toggleCategoryValue,
} from "../lib/transaction-filters.js";

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
