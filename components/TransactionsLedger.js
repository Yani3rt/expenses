"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExpenseRow } from "./DashboardPrimitives.js";
import { money, monthLabel } from "../lib/format.js";
import { fetchTransactionsPage } from "../lib/transactions-client.js";
import { fetchTransactionDetail } from "../lib/transactions-client.js";
import TransactionDetailDialog from "./TransactionDetailDialog.js";

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
  const detailTrigger = useRef(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailStatus, setDetailStatus] = useState("idle");
  const [detailError, setDetailError] = useState("");

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
    setDetailStatus("loading");
    setDetailError("");
    try {
      const payload = await fetchTransactionDetail(detailApiUrl(transaction), { signal: controller.signal });
      if (!controller.signal.aborted) {
        setDetail(payload);
        setDetailStatus("success");
      }
    } catch (error) {
      if (error?.name !== "AbortError" && !controller.signal.aborted) {
        setDetailError(error instanceof Error ? error.message : "Transaction details are temporarily unavailable. Please try again.");
        setDetailStatus("error");
      }
    }
  }

  function openDetail(transaction, trigger) {
    detailTrigger.current = trigger;
    setSelectedTransaction(transaction);
    setDetail(null);
    requestDetail(transaction);
  }

  function closeDetail() {
    detailRequest.current?.abort();
    setSelectedTransaction(null);
    setDetail(null);
    setDetailStatus("idle");
    window.requestAnimationFrame(() => detailTrigger.current?.focus());
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
      {selectedTransaction ? (
        <TransactionDetailDialog
          transaction={selectedTransaction}
          detail={detail}
          status={detailStatus}
          error={detailError}
          onRetry={() => requestDetail(selectedTransaction)}
          onClose={closeDetail}
        />
      ) : null}
    </section>
  );
}
