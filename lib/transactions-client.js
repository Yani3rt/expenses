export async function fetchTransactionsPage(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("More transactions are temporarily unavailable. Please try again.");
  }

  const payload = await response.json();
  if (!Array.isArray(payload?.transactions) || !payload?.meta || typeof payload.meta !== "object") {
    throw new Error("The server returned an unexpected response. Please try again.");
  }

  return {
    transactions: payload.transactions,
    meta: payload.meta,
    summary: payload.summary ?? null,
  };
}
