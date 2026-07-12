"use client";

import { useEffect, useRef } from "react";
import { money, shortDate } from "../lib/format.js";
import { installDialogBehavior, isBackdropDismissal } from "../lib/dialog-behavior.js";

function percent(value) {
  return value === null ? "—" : `${Number(value).toFixed(1)}%`;
}

export default function TransactionDetailDialog({ transaction, detail, status, error, onRetry, onClose }) {
  const dialogRef = useRef(null);
  const shownTransaction = detail?.transaction ?? transaction;
  const context = detail?.context;

  useEffect(() => {
    return installDialogBehavior({ dialog: dialogRef.current, document, onClose });
  }, [onClose]);

  const comparisons = context ? [
    ["Transaction amount", shownTransaction.amount],
    ["Filtered average", context.filteredAverage],
    ["Category average", context.categoryAverage],
  ] : [];
  const maxComparison = Math.max(...comparisons.map(([, value]) => Number(value || 0)), 1);

  return (
    <div className="transaction-dialog-backdrop" onMouseDown={(event) => isBackdropDismissal(event) && onClose()}>
      <section
        className="transaction-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-detail-title"
        aria-describedby="transaction-detail-description"
      >
        <header className="transaction-dialog-head">
          <div>
            <p className="label">Transaction insight</p>
            <h2 id="transaction-detail-title">{shownTransaction.description}</h2>
            <p id="transaction-detail-description">{shortDate(shownTransaction.date)} · {shownTransaction.category} · {shownTransaction.paidBy}</p>
          </div>
          <button className="transaction-dialog-close" type="button" onClick={onClose} aria-label="Close transaction details">×</button>
        </header>

        <div className="transaction-detail-summary" aria-label="Transaction summary">
          <div><span>Amount</span><strong>{money(shownTransaction.amount, shownTransaction.currency)}</strong></div>
          <div><span>Date</span><strong>{shortDate(shownTransaction.date)}</strong></div>
          <div><span>Category</span><strong>{shownTransaction.category}</strong></div>
          <div><span>Paid by</span><strong>{shownTransaction.paidBy}</strong></div>
        </div>

        {status === "loading" ? <div className="transaction-dialog-state" role="status">Loading transaction insights…</div> : null}
        {status === "error" ? (
          <div className="transaction-dialog-state" role="alert">
            <p>{error}</p>
            <button type="button" onClick={onRetry}>Try again</button>
          </div>
        ) : null}
        {status === "success" && context ? (
          <>
            <div className="transaction-detail-summary">
              <div><span>Overall rank</span><strong>#{context.rank} of {context.resultCount}</strong></div>
              <div><span>Share of filtered spend</span><strong>{percent(context.spendSharePercent)}</strong></div>
              <div><span>Compared with average</span><strong>{money(context.differenceFromAverage)}</strong></div>
              <div><span>Category rank</span><strong>#{context.categoryRank}</strong></div>
              <div><span>Share of category spend</span><strong>{percent(context.categorySharePercent)}</strong></div>
            </div>
            <ul className="transaction-comparison" aria-label="Amount comparison">
              {comparisons.map(([label, value]) => {
                const formattedValue = value === null ? "—" : money(value, shownTransaction.currency);
                return (
                <li className="transaction-comparison-row" key={label}>
                  <div><span>{label}</span><strong>{formattedValue}</strong></div>
                  <span className="transaction-comparison-track" aria-hidden="true">
                    <i style={{ width: `${Math.max((Number(value || 0) / maxComparison) * 100, value ? 4 : 0)}%` }} />
                  </span>
                </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </section>
    </div>
  );
}
