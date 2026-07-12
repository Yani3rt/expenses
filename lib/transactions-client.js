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

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullableNumber(value) {
  return value === null || isFiniteNumber(value);
}

function isTransactionDetailPayload(payload) {
  const transaction = payload?.transaction;
  const context = payload?.context;

  return isRecord(transaction)
    && Number.isSafeInteger(transaction.id)
    && transaction.id > 0
    && typeof transaction.date === "string"
    && typeof transaction.description === "string"
    && isFiniteNumber(transaction.amount)
    && typeof transaction.currency === "string"
    && typeof transaction.category === "string"
    && typeof transaction.categorySlug === "string"
    && typeof transaction.paidBy === "string"
    && (transaction.notes === null || typeof transaction.notes === "string")
    && isRecord(context)
    && Number.isSafeInteger(context.rank)
    && context.rank > 0
    && Number.isSafeInteger(context.resultCount)
    && context.resultCount > 0
    && isNullableNumber(context.spendSharePercent)
    && isNullableNumber(context.differenceFromAverage)
    && isNullableNumber(context.filteredAverage)
    && isNullableNumber(context.categoryAverage)
    && Number.isSafeInteger(context.categoryRank)
    && context.categoryRank > 0
    && isNullableNumber(context.categorySharePercent);
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

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The server returned an unexpected response. Please try again.");
  }

  if (!isTransactionDetailPayload(payload)) {
    throw new Error("The server returned an unexpected response. Please try again.");
  }

  return {
    transaction: payload.transaction,
    context: payload.context,
  };
}
