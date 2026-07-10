import test from "node:test";
import assert from "node:assert/strict";
import { fetchTransactionsPage } from "../lib/transactions-client.js";

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
