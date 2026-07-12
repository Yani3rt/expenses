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

export async function fetchTransactionDetail(
  url,
  { signal, fetchImpl = fetch } = {},
) {
  const response = await fetchImpl(url, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    let message = "Transaction details are temporarily unavailable. Please try again.";
    try {
      const payload = await response.json();
      if (typeof payload?.error === "string" && payload.error.trim()) {
        message = payload.error;
      }
    } catch {
      // Keep the recoverable fallback when an error response has no JSON body.
    }
    throw new Error(message);
  }

  const payload = await response.json();
  const hasTransaction = payload?.transaction
    && typeof payload.transaction === "object"
    && !Array.isArray(payload.transaction);
  const hasContext = payload?.context
    && typeof payload.context === "object"
    && !Array.isArray(payload.context);

  if (!hasTransaction || !hasContext) {
    throw new Error("The server returned an unexpected response. Please try again.");
  }

  return {
    transaction: payload.transaction,
    context: payload.context,
  };
}
