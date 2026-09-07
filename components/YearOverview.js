"use client";

import Select from "./Select.js";

import { useState } from "react";
import Link from "next/link";
import { money } from "../lib/format.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function YearOverview({ calendar, currency }) {
  const currentYear = calendar.today.slice(0, 4);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [open, setOpen] = useState(false);
  const years = [...new Set([currentYear, ...calendar.months.map(row => row.month.slice(0, 4))])].sort().reverse();
  const year = years.includes(selectedYear) ? selectedYear : currentYear;
  const totals = new Map(calendar.months.map(row => [row.month, row.totalSpend]));
  const months = MONTHS.map((label, index) => {
    const month = `${year}-${String(index + 1).padStart(2, "0")}`;
    return { label, month, future: month > calendar.today.slice(0, 7), total: totals.get(month) || 0 };
  });
  const maximum = Math.max(...months.map(row => Math.abs(row.total)), 1);
  const total = months.reduce((sum, row) => sum + row.total, 0);

  return (
    <section className={open ? "year-overview is-open" : "year-overview"} aria-labelledby="year-overview-title">
      <div className="year-overview-header">
        <h2 id="year-overview-title">Year overview</h2>
        <button className="year-overview-toggle" type="button" aria-expanded={open} aria-controls="year-overview-content" onClick={() => setOpen(value => !value)}>Year overview <span aria-hidden="true">{open ? "−" : "+"}</span></button>
        <label><span className="sr-only">Overview year</span><Select aria-label="Overview year" value={year} onChange={event => setSelectedYear(event.target.value)}>{years.map(value => <option key={value}>{value}</option>)}</Select></label>
      </div>
      <div id="year-overview-content" className="year-overview-content">
        <div className="year-total"><span>{year === currentYear ? "Year to date" : "Year total"}</span><strong>{money(total, currency)}</strong></div>
        <div className="year-months" aria-label={`Monthly spending in ${year}`}>
          {months.map(row => {
            const content = <><span className="year-month-value">{row.future ? "—" : money(row.total, currency)}</span><span className="year-bar-track" aria-hidden="true"><i style={{ height: `${Math.abs(row.total) / maximum * 100}%` }} /></span><span>{row.label}</span></>;
            return row.future
              ? <div className="year-month is-future" key={row.month} aria-label={`${row.label} ${year}, future month`}>{content}</div>
              : <Link className="year-month" key={row.month} href={`/transactions?month=${row.month}&period=all`} aria-label={`${row.label} ${year}: ${money(row.total, currency)}. View transactions`}>{content}</Link>;
          })}
        </div>
      </div>
    </section>
  );
}
