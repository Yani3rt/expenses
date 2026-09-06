import test from "node:test";
import assert from "node:assert/strict";
import { GET as getTransactions } from "../app/api/transactions/route.js";
import {
  buildTransactionsUrl,
  prepareTransactionsNavigation,
  transactionsIntentFromSearchParams,
  updateTransactionsIntent,
} from "../lib/transaction-filters.js";
import {
  createTransactionsPageRequester,
  fetchTransactionsPage,
  getTransactionsContinuationOffset,
} from "../lib/transactions-client.js";
import { useExpenseFixture } from "../test-support/expense-fixture.js";

useExpenseFixture();

test("route search params provide authoritative filter intent for history navigation", () => {
  assert.deepEqual(
    transactionsIntentFromSearchParams(new URLSearchParams(
      "q=hotel&period=all&category=viajes&category=tecnologia&sort=highest&offset=20&limit=2",
    )),
    {
      q: "hotel",
      period: "all",
      month: "all",
      categories: ["viajes", "tecnologia"],
      sort: "highest",
      offset: "20",
      limit: "2",
    },
  );
  assert.deepEqual(
    transactionsIntentFromSearchParams(new URLSearchParams()),
    {
      q: "",
      period: "this_month",
      month: "all",
      categories: [],
      sort: "newest",
      offset: 0,
      limit: 10,
    },
  );
});

test("a pending search remains in every later filter navigation before route commit", () => {
  const initialIntent = {
    q: "",
    period: "this_month",
    month: "all",
    categories: [],
    sort: "newest",
    offset: 20,
    limit: 10,
  };

  for (const [changes, expected] of [
    [{ categories: ["viajes"] }, "/transactions?q=train&period=this_month&category=viajes"],
    [{ period: "last_month", month: "all" }, "/transactions?q=train&period=last_month"],
    [{ period: "all", month: "2026-06" }, "/transactions?q=train&period=all&month=2026-06"],
    [{ sort: "highest" }, "/transactions?q=train&period=this_month&sort=highest"],
  ]) {
    let intent = updateTransactionsIntent(initialIntent, { q: "train" });
    intent = updateTransactionsIntent(intent, changes);
    assert.equal(buildTransactionsUrl(intent), expected);
  }
});

test("active-chip changes share pending intent and clear-all supersedes it", () => {
  const pending = updateTransactionsIntent({
    q: "",
    period: "this_month",
    month: "all",
    categories: ["tecnologia", "viajes"],
    sort: "highest",
    offset: 0,
    limit: 10,
  }, { q: "train" });

  assert.equal(
    buildTransactionsUrl(updateTransactionsIntent(pending, { categories: ["viajes"] })),
    "/transactions?q=train&period=this_month&category=viajes&sort=highest",
  );
  assert.equal(
    buildTransactionsUrl(updateTransactionsIntent(pending, {
      q: "",
      period: "all",
      month: "all",
      categories: [],
      sort: "newest",
      offset: 0,
      limit: 10,
    })),
    "/transactions?period=all",
  );
});

test("cleared search stays cleared through the next action before route commit", () => {
  const initial = {
    q: "train",
    period: "this_month",
    month: "all",
    categories: ["viajes"],
    sort: "newest",
    offset: 0,
    limit: 10,
  };

  for (const [clearChanges, nextChanges, expected] of [
    [{ q: "" }, { categories: ["tecnologia"] }, "/transactions?period=this_month&category=tecnologia"],
    [{
      q: "",
      period: "all",
      month: "all",
      categories: [],
      sort: "newest",
      offset: 0,
      limit: 10,
    }, { period: "last_month", month: "all" }, "/transactions?period=last_month"],
  ]) {
    const cleared = prepareTransactionsNavigation(initial, initial.q, clearChanges);
    const next = prepareTransactionsNavigation(cleared.intent, cleared.query, nextChanges);
    assert.equal(buildTransactionsUrl(next.intent), expected);
  }
});

test("pagination continues after an initial nonzero offset and the displayed page", () => {
  assert.equal(getTransactionsContinuationOffset({ offset: 20 }, 10), 30);
});

test("transactions API defaults to ten rows and preserves an explicit limit", async () => {
  const defaultResponse = await getTransactions(new Request("http://localhost/api/transactions?period=all"));
  const defaultPayload = await defaultResponse.json();
  assert.equal(defaultPayload.meta.limit, 10);
  assert.equal(defaultPayload.transactions.length, 10);

  const limitedResponse = await getTransactions(new Request("http://localhost/api/transactions?period=all&limit=2"));
  const limitedPayload = await limitedResponse.json();
  assert.equal(limitedPayload.meta.limit, 2);
  assert.equal(limitedPayload.transactions.length, 2);
});

test("transactions API round-trips repeated category filters", async () => {
  const response = await getTransactions(new Request(
    "http://localhost/api/transactions?period=all&category=tecnologia&category=viajes&limit=2",
  ));
  const payload = await response.json();

  assert.deepEqual(payload.meta.categories, ["tecnologia", "viajes"]);
  assert.ok(payload.transactions.every((transaction) => ["tecnologia", "viajes"].includes(transaction.categorySlug)));
});

test("fetchTransactionsPage forwards an abort signal", async () => {
  const controller = new AbortController();
  await fetchTransactionsPage("/api/transactions", {
    signal: controller.signal,
    fetchImpl: async (url, options) => {
      assert.equal(url, "/api/transactions");
      assert.equal(options.signal, controller.signal);
      return {
        ok: true,
        json: async () => ({ transactions: [], meta: { hasMore: false } }),
      };
    },
  });
});

test("a delayed superseded page cannot publish success or settle a newer request", async () => {
  const pending = new Map();
  const requester = createTransactionsPageRequester((url, { signal }) => new Promise((resolve) => {
    pending.set(url, { resolve, signal });
  }));
  const events = [];

  const oldRequest = requester.request("old", {
    onSuccess: () => events.push("old success"),
    onSettled: () => events.push("old settled"),
  });
  const newRequest = requester.request("new", {
    onSuccess: () => events.push("new success"),
    onSettled: () => events.push("new settled"),
  });

  assert.equal(pending.get("old").signal.aborted, true);
  pending.get("old").resolve({ transactions: [{ id: 1 }], meta: {} });
  await oldRequest;
  assert.deepEqual(events, []);

  pending.get("new").resolve({ transactions: [{ id: 2 }], meta: {} });
  await newRequest;
  assert.deepEqual(events, ["new success", "new settled"]);
});

test("filter invalidation aborts the current page and suppresses every handler", async () => {
  let pending;
  const requester = createTransactionsPageRequester((url, { signal }) => new Promise((resolve) => {
    pending = { resolve, signal };
  }));
  const events = [];
  const request = requester.request("old-filter", {
    onSuccess: () => events.push("success"),
    onError: () => events.push("error"),
    onSettled: () => events.push("settled"),
  });

  requester.cancel();
  assert.equal(pending.signal.aborted, true);
  pending.resolve({ transactions: [{ id: 1 }], meta: {} });
  await request;

  assert.deepEqual(events, []);
});

test("a rejected page reports a recoverable error and a retry can succeed", async () => {
  let attempt = 0;
  const requester = createTransactionsPageRequester(async () => {
    attempt += 1;
    if (attempt === 1) throw new Error("Offline");
    return { transactions: [{ id: 2 }], meta: { hasMore: false } };
  });
  const events = [];

  await requester.request("/api/transactions", {
    onError: (error) => events.push(error.message),
    onSettled: () => events.push("settled 1"),
  });
  await requester.request("/api/transactions", {
    onSuccess: (payload) => events.push(payload.transactions[0].id),
    onSettled: () => events.push("settled 2"),
  });

  assert.deepEqual(events, ["Offline", "settled 1", 2, "settled 2"]);
});
