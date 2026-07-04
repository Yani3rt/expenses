"use client";

import { useMemo, useState } from "react";
import { ExpenseRow } from "./DashboardPrimitives.js";
import { money, monthLabel } from "../lib/format.js";

function buildTransactionsApiUrl(meta, nextValues = {}) {
  const params = new URLSearchParams();
  const { q, period, month, category, sort, offset, limit } = { ...meta, ...nextValues };
  const values = { q, period, month, category, sort, offset, limit };
  for (const [key, value] of Object.entries(values)) {
    if (!value || value === "all" || value === 0 || (key === "sort" && value === "newest") || (key === "limit" && Number(value) === 50)) continue;
    params.set(key, value);
  }
  const href = params.toString() ? `/transactions?${params.toString()}` : "/transactions";
  const query = href.split("?")[1];
  return query ? `/api/transactions?${query}` : "/api/transactions";
}

export default function TransactionsLedger({ initialTransactions, summary, meta }) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [state, setState] = useState(meta);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [enteredIds, setEnteredIds] = useState([]);

  const displayedCount = transactions.length;
  const periodBadge = state.month !== "all" ? monthLabel(state.month) : state.periodLabel;

  async function loadMore() {
    if (isLoadingMore || !state.hasMore) return;
    setIsLoadingMore(true);

    try {
      const response = await fetch(buildTransactionsApiUrl(state, { offset: displayedCount, limit: state.limit }), {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error(`Failed to load more transactions: ${response.status}`);

      const payload = await response.json();
      const nextItems = payload.transactions || [];
      const newIds = nextItems.map((expense) => expense.id);

      setTransactions((current) => [...current, ...nextItems]);
      setState(payload.meta);
      setEnteredIds(newIds);
      window.setTimeout(() => setEnteredIds([]), 650);
    } finally {
      setIsLoadingMore(false);
    }
  }

  const enteredLookup = useMemo(() => new Set(enteredIds), [enteredIds]);

  return (
    <section className="card ledger-card">
      <div className="section-head">
        <div>
          <p className="label">Ledger</p>
          <h2>{summary.expenseCount} matching transactions</h2>
        </div>
        <span className="readonly-chip">{periodBadge}</span>
      </div>
      {transactions.length ? (
        <>
          <div className="expense-list dense-list">
            {transactions.map((expense) => (
              <ExpenseRow
                expense={expense}
                key={expense.id}
                className={enteredLookup.has(expense.id) ? "row-enter" : ""}
              />
            ))}
          </div>
          {state.hasMore ? (
            <div className="load-more-wrap">
              <button className="load-more-link" onClick={loadMore} type="button" disabled={isLoadingMore}>
                {isLoadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="empty-state">
          <strong>No expenses match those filters.</strong>
          <span>Try a broader date range, remove a chip, or clear all filters. The DB remains untouched, as promised.</span>
          <a className="clear-filters-link" href="/transactions">Reset filters</a>
        </div>
      )}
      <div className="ledger-foot">
        Showing {displayedCount} of {summary.expenseCount} rows · {money(summary.totalSpend)} total in this view
      </div>
    </section>
  );
}
