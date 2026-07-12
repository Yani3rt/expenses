"use client";

import { useEffect, useRef } from "react";
import { money, monthLabel, shortDate } from "../lib/format.js";
import { categoryTone } from "../lib/categories.js";
import { createDialogBehaviorSession, isBackdropDismissal } from "../lib/dialog-behavior.js";

function monthChange(categoryMonth, currency) {
  if (categoryMonth.isNewThisMonth) return "New this month";
  const percent = Math.abs(Number(categoryMonth.deltaPercent || 0)).toFixed(1);
  const direction = categoryMonth.deltaAmount >= 0 ? "+" : "";
  return `${direction}${money(categoryMonth.deltaAmount, currency)} · ${percent}%`;
}

export default function TransactionDetailDialog({ transaction, detail, status, error, onRetry, onClose }) {
  const dialogRef = useRef(null);
  const behaviorSessionRef = useRef(null);
  const shownTransaction = detail?.transaction ?? transaction;
  const categoryMonth = detail?.categoryMonth;
  const selectedMonth = categoryMonth?.month ?? shownTransaction.date.slice(0, 7);
  const tone = categoryTone(categoryMonth?.categorySlug ?? shownTransaction.categorySlug);
  const categoryAccent = tone === "muted" ? "var(--on-variant)" : `var(--${tone})`;
  behaviorSessionRef.current?.update({ onClose, status });

  useEffect(() => {
    const session = createDialogBehaviorSession({ dialog: dialogRef.current, document, onClose });
    behaviorSessionRef.current = session;
    return () => {
      behaviorSessionRef.current = null;
      session.destroy();
    };
  }, []);

  const maxDaily = Math.max(...(categoryMonth?.dailyTotals ?? []).map((day) => Number(day.totalSpend || 0)), 1);

  return (
    <div className="transaction-dialog-backdrop" onMouseDown={(event) => isBackdropDismissal(event) && onClose()}>
      <section
        className="transaction-dialog"
        style={{ "--category-accent": categoryAccent }}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-detail-title"
        aria-describedby="transaction-detail-description"
      >
        <header className="transaction-dialog-head">
          <div>
            <p className="label">Category month</p>
            <h2 id="transaction-detail-title">{shownTransaction.category} in {monthLabel(selectedMonth)}</h2>
            <p id="transaction-detail-description">Selected: {shownTransaction.description} · {shortDate(shownTransaction.date)} · {shownTransaction.paidBy}</p>
          </div>
          <button className="transaction-dialog-close" type="button" onClick={onClose} aria-label="Close transaction details">×</button>
        </header>

        {status === "loading" ? <div className="transaction-dialog-state" role="status">Loading transaction insights…</div> : null}
        {status === "error" ? (
          <div className="transaction-dialog-state" role="alert">
            <p>{error}</p>
            <button type="button" onClick={onRetry}>Try again</button>
          </div>
        ) : null}
        {status === "success" && categoryMonth ? (
          <>
            <div className="transaction-detail-summary">
              <div><span>Category total</span><strong>{money(categoryMonth.totalSpend, shownTransaction.currency)}</strong></div>
              <div><span>Transactions</span><strong>{categoryMonth.expenseCount}</strong></div>
              <div><span>Average expense</span><strong>{money(categoryMonth.averageExpense, shownTransaction.currency)}</strong></div>
              <div><span>Change from {monthLabel(categoryMonth.previousMonth)}</span><strong>{monthChange(categoryMonth, shownTransaction.currency)}</strong></div>
            </div>
            <section className="category-month-chart" aria-labelledby="category-month-chart-title">
              <div className="category-month-section-head">
                <h3 id="category-month-chart-title">Spending by day</h3>
                <span>{categoryMonth.dailyTotals.length} active {categoryMonth.dailyTotals.length === 1 ? "day" : "days"}</span>
              </div>
              <div className="category-month-bars" role="list" aria-label={`${categoryMonth.category} daily spending in ${monthLabel(categoryMonth.month)}`}>
                {categoryMonth.dailyTotals.map((day) => (
                  <div
                    className={`category-month-day${day.date === categoryMonth.selectedDate ? " is-selected" : ""}`}
                    key={day.date}
                    role="listitem"
                    aria-label={`${shortDate(day.date)}: ${money(day.totalSpend, shownTransaction.currency)}, ${day.expenseCount} ${day.expenseCount === 1 ? "transaction" : "transactions"}`}
                  >
                    <span className="category-month-bar" aria-hidden="true">
                      <i style={{ height: `${Math.max((Number(day.totalSpend || 0) / maxDaily) * 100, 6)}%` }} />
                    </span>
                    <strong>{day.date.slice(-2)}</strong>
                  </div>
                ))}
              </div>
            </section>
            <section className="category-month-expenses" aria-labelledby="category-month-expenses-title">
              <div className="category-month-section-head">
                <h3 id="category-month-expenses-title">{categoryMonth.category} expenses</h3>
                <span>{monthLabel(categoryMonth.month)}</span>
              </div>
              <div className="category-month-expense-list">
                {categoryMonth.expenses.map((expense) => (
                  <article
                    className={`category-month-expense${expense.id === shownTransaction.id ? " is-selected" : ""}`}
                    key={expense.id}
                    aria-current={expense.id === shownTransaction.id ? "true" : undefined}
                  >
                    <span>
                      <strong>{expense.description}</strong>
                      <small>{shortDate(expense.date)} · {expense.paidBy}</small>
                    </span>
                    <b>{money(expense.amount, expense.currency)}</b>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </section>
    </div>
  );
}
