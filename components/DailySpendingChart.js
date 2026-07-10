"use client";

import { useRef } from "react";
import { money, shortDate } from "../lib/format.js";

export default function DailySpendingChart({ dailyTotals = [], className = "span-6" }) {
  const barsRef = useRef(null);
  const totalSpend = dailyTotals.reduce((sum, day) => sum + Number(day.totalSpend || 0), 0);
  const maxSpend = Math.max(...dailyTotals.map((day) => Number(day.totalSpend || 0)), 1);
  const averagePerDay = dailyTotals.length ? totalSpend / dailyTotals.length : 0;
  const peakDay = dailyTotals.reduce(
    (peak, day) => (!peak || Number(day.totalSpend) > Number(peak.totalSpend) ? day : peak),
    null
  );
  const chartWidth = Math.max((dailyTotals.length - 1) * 78 + 72, 520);
  const chartBaseline = 176;
  const chartTop = 34;
  const points = dailyTotals.map((day, index) => {
    const x = dailyTotals.length === 1 ? chartWidth / 2 : 36 + (index * (chartWidth - 72)) / (dailyTotals.length - 1);
    const y = chartBaseline - (Number(day.totalSpend || 0) / maxSpend) * (chartBaseline - chartTop);
    return { ...day, x, y };
  });
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = points.length
    ? `${points[0].x},${chartBaseline} ${linePoints} ${points.at(-1).x},${chartBaseline}`
    : "";

  function moveBars(direction) {
    const rail = barsRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.78, behavior: "smooth" });
  }

  return (
    <section className={`card daily-spending-card ${className}`.trim()}>
      <div className="section-head">
        <div>
          <p className="label">Daily spending</p>
          <h2>Spending days this month</h2>
          <p className="daily-spending-lede">Only days with recorded expenses are shown.</p>
        </div>
      </div>

      {dailyTotals.length ? (
        <>
          <div className="daily-spending-mobile-controls">
            <span>Swipe or use arrows · {dailyTotals.length} days</span>
            <div>
              <button type="button" onClick={() => moveBars(-1)} aria-label="Show earlier spending days">←</button>
              <button type="button" onClick={() => moveBars(1)} aria-label="Show later spending days">→</button>
            </div>
          </div>
          <div ref={barsRef} className="daily-spending-chart-rail">
            <svg
              className="daily-line-chart"
              style={{ "--daily-line-width": `${chartWidth}px` }}
              viewBox={`0 0 ${chartWidth} 220`}
              role="img"
              aria-label="Daily spending line chart"
            >
              <defs>
                <linearGradient id="daily-spending-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--blue)" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="var(--blue)" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {[58, 106, 154].map((y) => <line className="daily-line-grid" x1="36" x2={chartWidth - 36} y1={y} y2={y} key={y} />)}
              <polygon className="daily-line-area" points={areaPoints} />
              <polyline className="daily-line-path" points={linePoints} />
              {points.map((point) => (
                <g className="daily-line-point" key={point.date}>
                  <text x={point.x} y={Math.max(point.y - 13, 16)} textAnchor="middle">{money(point.totalSpend)}</text>
                  <circle cx={point.x} cy={point.y} r="5" />
                  <text className="daily-line-date" x={point.x} y="207" textAnchor="middle">{shortDate(point.date)}</text>
                </g>
              ))}
            </svg>
          </div>
          <div className="daily-spending-summary">
            <div><span>Spending days</span><strong>{dailyTotals.length}</strong></div>
            <div><span>Average per spending day</span><strong>{money(averagePerDay)}</strong></div>
            <div><span>Highest day</span><strong>{shortDate(peakDay?.date)} · {money(peakDay?.totalSpend)}</strong></div>
          </div>
        </>
      ) : (
        <p className="empty-state">No spending days recorded this month.</p>
      )}
    </section>
  );
}
