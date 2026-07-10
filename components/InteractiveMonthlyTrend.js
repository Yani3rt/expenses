"use client";

import { useMemo, useState } from "react";
import { money } from "../lib/format.js";

function fullYear(months) {
  const latestYear = months.at(-1)?.month?.slice(0, 4);
  if (!latestYear) return [];
  const byMonth = new Map(months.map((month) => [month.month, month]));
  return Array.from({ length: 12 }, (_, index) => {
    const key = `${latestYear}-${String(index + 1).padStart(2, "0")}`;
    return byMonth.get(key) || { month: key, totalSpend: 0, expenseCount: 0 };
  });
}

export default function InteractiveMonthlyTrend({ months = [], className = "span-5" }) {
  const [expanded, setExpanded] = useState(false);
  const yearMonths = useMemo(() => fullYear(months), [months]);
  const latestMonthNumber = Number(months.at(-1)?.month?.slice(5, 7) || 0);
  const recentMonths = yearMonths.slice(0, latestMonthNumber).slice(-4);
  const visibleMonths = expanded ? yearMonths : recentMonths;
  const max = Math.max(...visibleMonths.map((month) => Number(month.totalSpend || 0)), 1);

  return (
    <section className={`card monthly-trend-card ${className}${expanded ? " is-expanded" : ""}`}>
      <div className="monthly-trend-head">
        <div>
          <p className="label">Timeline</p>
          <h2>Monthly trend</h2>
        </div>
        {months.length ? (
          <button className="share-reset" type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
            {expanded ? "Show less" : "Show more"}
          </button>
        ) : null}
      </div>
      <div className={`month-bars${expanded ? " is-expanded" : ""}${!expanded && visibleMonths.length === 4 ? " has-four-months" : ""}`}>
        {visibleMonths.map((month, index) => {
          const total = Number(month.totalSpend || 0);
          return (
            <div className="month-col" key={month.month} style={{ "--month-index": index }}>
              <div className="month-track">
                <div style={{ height: total ? `${Math.max((total / max) * 100, 6)}%` : "0%" }} />
              </div>
              <strong>{money(total)}</strong>
              <span>{month.month}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
