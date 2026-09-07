"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { money, shortDate } from "../lib/format.js";

function addDay(value) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function completeTrend(trend, range) {
  if (!trend.length) return [];
  const totals = new Map(trend.map(day => [day.date, Number(day.totalSpend)]));
  const days = [];
  const finish = range.range === "all" ? trend.at(-1).date : range.end;
  for (let date = range.from || trend[0].date; date <= finish; date = addDay(date)) {
    days.push({ date, totalSpend: totals.get(date) || 0 });
  }
  return days;
}

export default function SpendingTrend({ trend, range, currency }) {
  const titleId = useId();
  const [active, setActive] = useState(null);
  const points = useMemo(() => completeTrend(trend, range), [trend, range]);
  const width = 760;
  const height = 244;
  const inset = { top: 18, right: 16, bottom: 30, left: 12 };
  const axisFormatter = useMemo(() => new Intl.NumberFormat("en-US", { style: "currency", currency, notation: "compact", maximumFractionDigits: 0 }), [currency]);
  let max = Math.max(0, ...points.map(day => day.totalSpend));
  let min = Math.min(0, ...points.map(day => day.totalSpend));
  if (max === min) max = min + 1;
  const x = index => inset.left + (points.length === 1 ? 0.5 : index / Math.max(points.length - 1, 1)) * (width - inset.left - inset.right);
  const y = value => inset.top + ((max - value) / (max - min)) * (height - inset.top - inset.bottom);
  const line = points.map((day, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(day.totalSpend).toFixed(1)}`).join(" ");
  const area = points.length ? `${line} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z` : "";
  const activeIndex = active === null ? null : Math.min(active, Math.max(points.length - 1, 0));
  const selected = activeIndex === null ? points.at(-1) : points[activeIndex];
  useEffect(() => setActive(null), [points]);

  function inspect(event) {
    if (!points.length) return;
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) event.preventDefault(); else return;
    if (event.key === "Home") setActive(0);
    else if (event.key === "End") setActive(points.length - 1);
    else setActive(current => Math.min(points.length - 1, Math.max(0, (current ?? points.length - 1) + (event.key === "ArrowLeft" ? -1 : 1))));
  }

  return (
    <section className="trend" aria-labelledby={titleId}>
      <div className="section-title-row">
        <h2 id={titleId}>Spending trend</h2>
        <output aria-live="polite">{selected ? `${shortDate(selected.date)} · ${money(selected.totalSpend, currency)}` : "No activity"}</output>
      </div>
      {points.length ? <div className="trend-plot">
        <div className="trend-graphic">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`Spending trend, ${range.label}. Use left and right arrow keys to inspect days.`} tabIndex="0" onKeyDown={inspect} onBlur={() => setActive(null)} onPointerLeave={() => setActive(null)} onPointerMove={event => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const plotX = (event.clientX - bounds.left) / bounds.width * width;
          const index = Math.round(((plotX - inset.left) / (width - inset.left - inset.right)) * (points.length - 1));
          setActive(Math.min(points.length - 1, Math.max(0, index)));
        }} onPointerDown={event => event.currentTarget.focus()}>
          {[inset.top, (height - inset.bottom + inset.top) / 2, height - inset.bottom].map(position => <line key={position} className="trend-rule" x1={inset.left} x2={width - inset.right} y1={position} y2={position} />)}
          <path className="trend-area" d={area} />
          <path className="trend-line" d={line} />
          {activeIndex !== null && points[activeIndex] ? <><line className="trend-cursor" x1={x(activeIndex)} x2={x(activeIndex)} y1={inset.top} y2={height - inset.bottom} /><circle className="trend-point active" cx={x(activeIndex)} cy={y(points[activeIndex].totalSpend)} r="6" aria-hidden="true" /></> : null}
        </svg>
        <div className="trend-y-axis" aria-hidden="true">{[[inset.top, max], [(height - inset.bottom + inset.top) / 2, (max + min) / 2], [height - inset.bottom, min]].map(([position, value]) => <span key={position} style={{ top: `${position / height * 100}%` }}>{axisFormatter.format(value)}</span>)}</div>
        </div>
        <div className="trend-axis" aria-hidden="true"><span>{shortDate(points[0].date)}</span><span>{shortDate(points.at(-1).date)}</span></div>
      </div> : <div className="trend-empty">
        <img className="trend-empty-character" src="/illustrations/receipt-detective.png" width="136" height="136" alt="" aria-hidden="true" />
        <span>No spending in this period.</span>
      </div>}
    </section>
  );
}
