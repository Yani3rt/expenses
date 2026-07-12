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

function isTransaction(transaction) {
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
    && (transaction.notes === null || typeof transaction.notes === "string");
}

function isTransactionDetailPayload(payload) {
  const categoryMonth = payload?.categoryMonth;
  return isTransaction(payload?.transaction)
    && isRecord(categoryMonth)
    && /^\d{4}-\d{2}$/.test(categoryMonth.month)
    && /^\d{4}-\d{2}$/.test(categoryMonth.previousMonth)
    && typeof categoryMonth.category === "string"
    && typeof categoryMonth.categorySlug === "string"
    && isFiniteNumber(categoryMonth.totalSpend)
    && Number.isSafeInteger(categoryMonth.expenseCount)
    && categoryMonth.expenseCount > 0
    && isFiniteNumber(categoryMonth.averageExpense)
    && isFiniteNumber(categoryMonth.previousTotalSpend)
    && isFiniteNumber(categoryMonth.deltaAmount)
    && isNullableNumber(categoryMonth.deltaPercent)
    && typeof categoryMonth.isNewThisMonth === "boolean"
    && typeof categoryMonth.selectedDate === "string"
    && Array.isArray(categoryMonth.dailyTotals)
    && categoryMonth.dailyTotals.every((day) => isRecord(day)
      && typeof day.date === "string"
      && isFiniteNumber(day.totalSpend)
      && Number.isSafeInteger(day.expenseCount)
      && day.expenseCount > 0)
    && Array.isArray(categoryMonth.expenses)
    && categoryMonth.expenses.every(isTransaction);
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
    categoryMonth: payload.categoryMonth,
  };
}
