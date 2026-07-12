"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ExpenseRow } from "./DashboardPrimitives.js";
import { money, monthLabel } from "../lib/format.js";
import { fetchTransactionsPage } from "../lib/transactions-client.js";
import { fetchTransactionDetail } from "../lib/transactions-client.js";
import TransactionDetailDialog from "./TransactionDetailDialog.js";
import { createInitialTransactionDetailState, transactionDetailReducer } from "../lib/transaction-detail-state.js";

function buildTransactionsApiUrl(meta, nextValues = {}) {
  const params = new URLSearchParams();
  const { q, period, month, category, sort, offset, limit } = { ...meta, ...nextValues };
  const values = { q, period, month, category, sort, offset, limit };
  for (const [key, value] of Object.entries(values)) {
    if (!value || value === "all" || value === 0 || (key === "sort" && value === "newest") || (key === "limit" && Number(value) === 10)) continue;
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
  const [loadError, setLoadError] = useState("");
  const rowAnimationTimer = useRef(null);
  const detailRequest = useRef(null);
  const [detailState, dispatchDetail] = useReducer(transactionDetailReducer, undefined, createInitialTransactionDetailState);

  useEffect(() => {
    setTransactions(initialTransactions);
    setState(meta);
    setEnteredIds([]);
    setIsLoadingMore(false);
    setLoadError("");
  }, [initialTransactions, meta]);

  useEffect(() => () => {
    if (rowAnimationTimer.current) window.clearTimeout(rowAnimationTimer.current);
    detailRequest.current?.abort();
  }, []);

  function detailApiUrl(transaction) {
    const params = new URLSearchParams();
    for (const key of ["q", "period", "month", "category"]) {
      const value = state[key];
      if (value && value !== "all") params.set(key, value);
    }
    const query = params.toString();
    return `/api/transactions/${transaction.id}${query ? `?${query}` : ""}`;
  }

  async function requestDetail(transaction) {
    detailRequest.current?.abort();
    const controller = new AbortController();
    detailRequest.current = controller;
    dispatchDetail({ type: "retry" });
    try {
      const payload = await fetchTransactionDetail(detailApiUrl(transaction), { signal: controller.signal });
      if (!controller.signal.aborted) {
        dispatchDetail({ type: "success", detail: payload });
      }
    } catch (error) {
      if (error?.name !== "AbortError" && !controller.signal.aborted) {
        dispatchDetail({ type: "failure", error: error instanceof Error ? error.message : "Transaction details are temporarily unavailable. Please try again." });
      }
    }
  }

  function openDetail(transaction, trigger) {
    dispatchDetail({ type: "open", transaction, trigger });
    requestDetail(transaction);
  }

  function closeDetail() {
    detailRequest.current?.abort();
    const closedState = transactionDetailReducer(detailState, { type: "close" });
    dispatchDetail({ type: "close" });
    window.requestAnimationFrame(closedState.restoreFocus);
  }

  const displayedCount = transactions.length;
  const periodBadge = state.month !== "all" ? monthLabel(state.month) : state.periodLabel;

  async function loadMore() {
    if (isLoadingMore || !state.hasMore) return;
    setIsLoadingMore(true);
    setLoadError("");

    try {
      const payload = await fetchTransactionsPage(buildTransactionsApiUrl(state, { offset: displayedCount, limit: state.limit }));
      const nextItems = payload.transactions;
      const newIds = nextItems.map((expense) => expense.id);

      setTransactions((current) => [...current, ...nextItems]);
      setState(payload.meta);
      setEnteredIds(newIds);
      if (rowAnimationTimer.current) window.clearTimeout(rowAnimationTimer.current);
      rowAnimationTimer.current = window.setTimeout(() => setEnteredIds([]), 650);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "More transactions are temporarily unavailable. Please try again.");
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
                onClick={(event) => openDetail(expense, event.currentTarget)}
              />
            ))}
          </div>
          {loadError ? (
            <div className="ledger-error" role="status">
              <span>{loadError}</span>
              <button className="load-more-link" onClick={loadMore} type="button" disabled={isLoadingMore}>
                Try again
              </button>
            </div>
          ) : state.hasMore ? (
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
      {detailState.transaction ? (
        <TransactionDetailDialog
          transaction={detailState.transaction}
          detail={detailState.detail}
          status={detailState.status}
          error={detailState.error}
          onRetry={() => requestDetail(detailState.transaction)}
          onClose={closeDetail}
        />
      ) : null}
    </section>
  );
}
