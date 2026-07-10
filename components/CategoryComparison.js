import Link from "next/link";
import { CategoryIcon } from "./Icons.js";
import { categoryTone } from "../lib/categories.js";
import { compactNumber, money, monthLabel } from "../lib/format.js";

function signedMoney(value) {
  return `${value > 0 ? "+" : ""}${money(value)}`;
}

function deltaDetail(row) {
  if (row.direction === "new") return "New this month";
  if (row.direction === "flat") return "No change";
  if (row.deltaPercent === null) return "No prior spending";
  return `${row.deltaPercent > 0 ? "+" : ""}${compactNumber(row.deltaPercent)}%`;
}

function ComparisonRow({ row, activeMonth, previousMonth }) {
  const tone = categoryTone(row.categorySlug);
  const scale = Math.max(row.currentTotal, row.previousTotal, 1);
  const currentWidth = (row.currentTotal / scale) * 100;
  const previousWidth = (row.previousTotal / scale) * 100;

  return (
    <Link
      className={`category-comparison-row direction-${row.direction}`}
      href={`/transactions?month=${encodeURIComponent(activeMonth)}&category=${encodeURIComponent(row.categorySlug)}`}
    >
      <div className="category-comparison-name">
        <span className={`category-comparison-icon tone-${tone}`}><CategoryIcon slug={row.categorySlug} /></span>
        <strong>{row.category}</strong>
      </div>
      <div className="category-comparison-period">
        <span>{monthLabel(activeMonth)}</span>
        <strong>{money(row.currentTotal)}</strong>
      </div>
      <div className="category-comparison-period">
        <span>{monthLabel(previousMonth)}</span>
        <strong>{money(row.previousTotal)}</strong>
      </div>
      <div className="category-comparison-delta">
        <strong>{signedMoney(row.deltaAmount)}</strong>
        <span>{deltaDetail(row)}</span>
      </div>
      <div className="category-comparison-bars" aria-hidden="true">
        <i className="comparison-bar-current" style={{ width: `${currentWidth}%` }} />
        <i className="comparison-bar-previous" style={{ width: `${previousWidth}%` }} />
      </div>
    </Link>
  );
}

function HistoricalRow({ row }) {
  const tone = categoryTone(row.categorySlug);

  return (
    <Link className="category-comparison-row historical-row" href={`/transactions?month=all&category=${encodeURIComponent(row.categorySlug)}`}>
      <div className="category-comparison-name">
        <span className={`category-comparison-icon tone-${tone}`}><CategoryIcon slug={row.categorySlug} /></span>
        <strong>{row.category}</strong>
      </div>
      <div className="category-comparison-period">
        <span>Total spend</span>
        <strong>{money(row.totalSpend)}</strong>
      </div>
      <div className="category-comparison-period">
        <span>Transactions</span>
        <strong>{compactNumber(row.expenseCount)}</strong>
      </div>
      <div className="category-comparison-delta historical-share">
        <strong>{compactNumber(row.sharePercent)}%</strong>
        <span>of all spending</span>
      </div>
      <div className="category-comparison-bars" aria-hidden="true">
        <i className="comparison-bar-current" style={{ width: `${row.sharePercent}%` }} />
      </div>
    </Link>
  );
}

export default function CategoryComparison({ comparison }) {
  const isHistorical = comparison.mode === "historical";

  return (
    <section className="card span-12 category-comparison">
      <div className="section-head category-comparison-head">
        <div>
          <p className="label">{isHistorical ? "Historical breakdown" : "Month over month"}</p>
          <h2>{isHistorical ? "Category totals" : "Category comparison"}</h2>
          <p className="category-comparison-lede">
            {isHistorical
              ? "See how each category contributes to all recorded spending."
              : `${monthLabel(comparison.activeMonth)} compared with ${monthLabel(comparison.previousMonth)}, ordered by the biggest change.`}
          </p>
        </div>
      </div>

      {comparison.rows.length ? (
        <div className="category-comparison-list">
          {comparison.rows.map((row) => isHistorical
            ? <HistoricalRow row={row} key={row.categorySlug} />
            : <ComparisonRow row={row} activeMonth={comparison.activeMonth} previousMonth={comparison.previousMonth} key={row.categorySlug} />)}
        </div>
      ) : (
        <div className="empty-state">
          <strong>No category spending for this period.</strong>
          <span>Choose a different month to compare the breakdown.</span>
        </div>
      )}
    </section>
  );
}
