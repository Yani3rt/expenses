import test from "node:test";
import assert from "node:assert/strict";
import { fetchTransactionDetail, fetchTransactionsPage } from "../lib/transactions-client.js";

test("fetchTransactionsPage returns a validated transaction page", async () => {
  const payload = {
    transactions: [{ id: 1, description: "Groceries" }],
    meta: { hasMore: false, offset: 10 },
    summary: { expenseCount: 1, totalSpend: 20 },
  };

  const result = await fetchTransactionsPage("/api/transactions", async (url, options) => {
    assert.equal(url, "/api/transactions");
    assert.equal(options.headers.Accept, "application/json");
    return { ok: true, json: async () => payload };
  });

  assert.deepEqual(result, payload);
});

test("fetchTransactionsPage reports a recoverable service error", async () => {
  await assert.rejects(
    () => fetchTransactionsPage("/api/transactions", async () => ({ ok: false, status: 503 })),
    /temporarily unavailable/i,
  );
});

test("fetchTransactionsPage rejects malformed payloads", async () => {
  await assert.rejects(
    () => fetchTransactionsPage("/api/transactions", async () => ({
      ok: true,
      json: async () => ({ transactions: "not-an-array", meta: null }),
    })),
    /unexpected response/i,
  );
});

test("fetchTransactionDetail returns validated transaction context and forwards an abort signal", async () => {
  const payload = {
    transaction: { id: 4, description: "Technology expense" },
    context: { rank: 1, resultCount: 2 },
  };
  const controller = new AbortController();

  const result = await fetchTransactionDetail("/api/transactions/4?q=tech", {
    signal: controller.signal,
    fetchImpl: async (url, options) => {
      assert.equal(url, "/api/transactions/4?q=tech");
      assert.equal(options.headers.Accept, "application/json");
      assert.equal(options.signal, controller.signal);
      return { ok: true, json: async () => payload };
    },
  });

  assert.deepEqual(result, payload);
});

test("fetchTransactionDetail reports the API error message for non-OK responses", async () => {
  await assert.rejects(
    () => fetchTransactionDetail("/api/transactions/999", {
      fetchImpl: async () => ({
        ok: false,
        status: 404,
        json: async () => ({ error: "Transaction not found." }),
      }),
    }),
    /transaction not found/i,
  );
});

test("fetchTransactionDetail rejects malformed payloads", async () => {
  await assert.rejects(
    () => fetchTransactionDetail("/api/transactions/4", {
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({ transaction: null, context: [] }),
      }),
    }),
    /unexpected response/i,
  );
});
