"use client";

import { useEffect, useRef, useState } from "react";
import { money, monthLabel, shortDate } from "../lib/format.js";
import { categoryTone } from "../lib/categories.js";
import { createDialogBehaviorSession, isBackdropDismissal } from "../lib/dialog-behavior.js";
import { BarChart } from "./dither-kit/bar-chart";
import { Bar } from "./dither-kit/bar";
import { Tooltip } from "./dither-kit/tooltip";
import { XAxis } from "./dither-kit/x-axis";

const DITHER_COLORS = {
  emerald: "green",
  violet: "purple",
  amber: "orange",
  blue: "blue",
  cyan: "blue",
  pink: "pink",
  indigo: "purple",
  coral: "red",
  primary: "grey",
  muted: "grey",
};

function monthChange(categoryMonth, currency) {
  if (categoryMonth.isNewThisMonth) return "New";
  const percent = Math.abs(Number(categoryMonth.deltaPercent || 0)).toFixed(1);
  const direction = categoryMonth.deltaAmount >= 0 ? "+" : "";
  return `${direction}${money(categoryMonth.deltaAmount, currency)} · ${percent}%`;
}

function buildMonthChartData(categoryMonth) {
  if (!categoryMonth) return [];

  const totalsByDate = new Map(categoryMonth.dailyTotals.map((day) => [day.date, day]));
  const [year, month] = categoryMonth.month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    const date = `${categoryMonth.month}-${day}`;
    const total = totalsByDate.get(date);

    return {
      date,
      day: date.slice(-2),
      label: shortDate(date),
      totalSpend: Number(total?.totalSpend ?? 0),
      expenseCount: total?.expenseCount ?? 0,
    };
  });
}

function useCompactMonthChart() {
  const [compactChart, setCompactChart] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1080px)");
    const update = () => setCompactChart(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return compactChart;
}

export default function TransactionDetailDialog({ transaction, detail, status, error, onRetry, onClose }) {
  const dialogRef = useRef(null);
  const behaviorSessionRef = useRef(null);
  const compactChart = useCompactMonthChart();
  const shownTransaction = detail?.transaction ?? transaction;
  const categoryMonth = detail?.categoryMonth;
  const selectedMonth = categoryMonth?.month ?? shownTransaction.date.slice(0, 7);
  const tone = categoryTone(categoryMonth?.categorySlug ?? shownTransaction.categorySlug);
  const categoryAccent = tone === "muted" ? "var(--on-variant)" : `var(--${tone})`;
  const fullChartData = buildMonthChartData(categoryMonth);
  const activeChartData = fullChartData.filter((day) => day.totalSpend > 0);
  const chartData = compactChart ? activeChartData : fullChartData;
  const chartConfig = {
    totalSpend: { label: "Daily total", color: DITHER_COLORS[tone] ?? "grey" },
  };
  behaviorSessionRef.current?.update({ onClose, status });

  useEffect(() => {
    const session = createDialogBehaviorSession({ dialog: dialogRef.current, document, onClose });
    behaviorSessionRef.current = session;
    return () => {
      behaviorSessionRef.current = null;
      session.destroy();
    };
  }, []);

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
              <BarChart
                data={chartData}
                config={chartConfig}
                bloom="low"
                margins={{ top: 16, right: 12, bottom: 24, left: 8 }}
                className="category-month-dither"
                animationDuration={520}
                tapToPinTooltip
              >
                <XAxis dataKey="day" />
                <Tooltip labelKey="label" valueFormatter={(value) => money(value, shownTransaction.currency)} />
                <Bar isClickable dataKey="totalSpend" variant="dotted" />
              </BarChart>
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
