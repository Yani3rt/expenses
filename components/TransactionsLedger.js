"use client";

import { useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import { ExpenseRow } from "./DashboardPrimitives.js";
import { money, monthLabel } from "../lib/format.js";
import {
  createTransactionsPageRequester,
  fetchTransactionDetail,
  getTransactionsContinuationOffset,
} from "../lib/transactions-client.js";
import TransactionDetailDialog from "./TransactionDetailDialog.js";
import { createInitialTransactionDetailState, transactionDetailReducer } from "../lib/transaction-detail-state.js";
import { buildTransactionsUrl } from "../lib/transaction-filters.js";

export default function TransactionsLedger({ initialTransactions, summary, meta }) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [state, setState] = useState(meta);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [enteredIds, setEnteredIds] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [nextOffset, setNextOffset] = useState(getTransactionsContinuationOffset(meta, initialTransactions.length));
  const rowAnimationTimer = useRef(null);
  const detailRequest = useRef(null);
  const pageRequester = useRef(null);
  if (!pageRequester.current) pageRequester.current = createTransactionsPageRequester();
  const [detailState, dispatchDetail] = useReducer(transactionDetailReducer, undefined, createInitialTransactionDetailState);

  useLayoutEffect(() => {
    pageRequester.current.cancel();
    if (rowAnimationTimer.current) window.clearTimeout(rowAnimationTimer.current);
    setTransactions(initialTransactions);
    setState(meta);
    setNextOffset(getTransactionsContinuationOffset(meta, initialTransactions.length));
    setEnteredIds([]);
    setIsLoadingMore(false);
    setLoadError("");
  }, [initialTransactions, meta]);

  useEffect(() => () => {
    if (rowAnimationTimer.current) window.clearTimeout(rowAnimationTimer.current);
    pageRequester.current.cancel();
    detailRequest.current?.abort();
  }, []);

  async function requestDetail(transaction) {
    detailRequest.current?.abort();
    const controller = new AbortController();
    detailRequest.current = controller;
    dispatchDetail({ type: "retry" });
    try {
      const payload = await fetchTransactionDetail(`/api/transactions/${transaction.id}`, { signal: controller.signal });
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
    const trigger = detailState.trigger;
    dispatchDetail({ type: "close" });
    window.requestAnimationFrame(() => trigger?.focus());
  }

  const displayedCount = transactions.length;
  const periodBadge = state.month !== "all" ? monthLabel(state.month) : state.periodLabel;

  async function loadMore() {
    if (isLoadingMore || !state.hasMore) return;
    await pageRequester.current.request(
      buildTransactionsUrl(state, { offset: nextOffset, limit: state.limit }, "/api/transactions"),
      {
        onStart: () => {
          setIsLoadingMore(true);
          setLoadError("");
        },
        onSuccess: (payload) => {
          const nextItems = payload.transactions;
          const newIds = nextItems.map((expense) => expense.id);

          setTransactions((current) => [...current, ...nextItems]);
          setState({ ...payload.meta, hasMore: nextItems.length > 0 && payload.meta.hasMore });
          setNextOffset(getTransactionsContinuationOffset(payload.meta, nextItems.length));
          setEnteredIds(newIds);
          if (rowAnimationTimer.current) window.clearTimeout(rowAnimationTimer.current);
          rowAnimationTimer.current = window.setTimeout(() => setEnteredIds([]), 650);
        },
        onError: (error) => {
          setLoadError(error instanceof Error ? error.message : "More transactions are temporarily unavailable. Please try again.");
        },
        onSettled: () => setIsLoadingMore(false),
      },
    );
  }

  const enteredLookup = useMemo(() => new Set(enteredIds), [enteredIds]);

  return (
    <section className="card ledger-card">
      <div className="section-head">
        <div>
          <h2>Operations</h2>
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
          <a className="clear-filters-link" href={buildTransactionsUrl({}, { period: "all" })}>Reset filters</a>
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
