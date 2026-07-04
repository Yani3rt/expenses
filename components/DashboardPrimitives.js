import Link from "next/link";
import { categoryTone } from "../lib/categories.js";
import { compactNumber, money, shortDate } from "../lib/format.js";

export function PageHeader({ kicker, title, children, action }) {
  return (
    <header className="page-header">
      <div>
        <p className="label">{kicker}</p>
        <h1>{title}</h1>
        {children ? <p className="lede">{children}</p> : null}
      </div>
      {action ? <div className="page-action">{action}</div> : null}
    </header>
  );
}

export function MetricCard({ label, value, detail, tone = "primary" }) {
  return (
    <section className={`card metric tone-${tone}`}>
      <p className="label">{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </section>
  );
}

export function CategoryPill({ slug, children }) {
  const tone = categoryTone(slug);
  return (
    <span className="pill">
      <i className={`dot tone-${tone}`} />
      {children}
    </span>
  );
}

export function CategoryBars({ categories, title = "Where the money went", label = "Category flow" }) {
  const max = Math.max(...categories.map((c) => c.totalSpend), 1);
  return (
    <section className="card span-7">
      <div className="section-head">
        <div>
          <p className="label">{label}</p>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="bars">
        {categories.map((category) => {
          const tone = categoryTone(category.categorySlug);
          const width = Math.max((category.totalSpend / max) * 100, 4);
          return (
            <div className="bar-row" key={category.categorySlug}>
              <div className="bar-meta">
                <CategoryPill slug={category.categorySlug}>{category.category}</CategoryPill>
                <strong>{money(category.totalSpend)}</strong>
              </div>
              <div className="bar-track">
                <div className={`bar-fill tone-${tone}`} style={{ width: `${width}%` }} />
              </div>
              <small>{category.expenseCount} expenses · avg {money(category.averageExpense)}</small>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function Donut({ categories }) {
  const total = categories.reduce((sum, item) => sum + item.totalSpend, 0) || 1;
  let offset = 25;
  const circumference = 2 * Math.PI * 42;
  const slices = categories.slice(0, 7).map((item) => {
    const value = (item.totalSpend / total) * circumference;
    const slice = { ...item, dash: `${value} ${circumference - value}`, offset };
    offset -= value;
    return slice;
  });
  return (
    <section className="card span-5 center-card">
      <p className="label">Category share</p>
      <div className="donut-wrap">
        <svg className="donut" viewBox="0 0 100 100" role="img" aria-label="Category spending donut chart">
          <circle cx="50" cy="50" r="42" className="donut-base" />
          {slices.map((slice) => (
            <circle key={slice.categorySlug} cx="50" cy="50" r="42" className={`donut-slice tone-${categoryTone(slice.categorySlug)}`} strokeDasharray={slice.dash} strokeDashoffset={slice.offset} />
          ))}
        </svg>
        <div className="donut-center">
          <strong>{money(total)}</strong>
          <span>Total</span>
        </div>
      </div>
      <div className="legend">
        {categories.slice(0, 6).map((c) => <CategoryPill key={c.categorySlug} slug={c.categorySlug}>{c.category}</CategoryPill>)}
      </div>
    </section>
  );
}

export function MonthlyTrend({ months }) {
  const max = Math.max(...months.map((m) => m.totalSpend), 1);
  return (
    <section className="card span-5">
      <p className="label">Timeline</p>
      <h2>Monthly trend</h2>
      <div className="month-bars">
        {months.map((month) => (
          <div className="month-col" key={month.month}>
            <div className="month-track">
              <div style={{ height: `${Math.max((month.totalSpend / max) * 100, 6)}%` }} />
            </div>
            <strong>{money(month.totalSpend)}</strong>
            <span>{month.month}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ExpenseList({ title, expenses, compact = false }) {
  return (
    <section className={`card ${compact ? "span-5" : "span-7"}`}>
      <div className="section-head">
        <div>
          <p className="label">{compact ? "Watchlist" : "Transaction feed"}</p>
          <h2>{title}</h2>
        </div>
        {!compact ? <Link className="text-link" href="/transactions">Open ledger</Link> : null}
      </div>
      <div className="expense-list">
        {expenses.map((expense) => <ExpenseRow expense={expense} key={`${title}-${expense.id}`} />)}
      </div>
    </section>
  );
}

export function ExpenseRow({ expense }) {
  return (
    <article className="expense-row">
      <div className={`expense-icon tone-${categoryTone(expense.categorySlug)}`}>{expense.category.slice(0, 1)}</div>
      <div>
        <strong>{expense.description}</strong>
        <span>{shortDate(expense.date)} · {expense.paidBy}{expense.notes ? ` · ${expense.notes}` : ""}</span>
      </div>
      <CategoryPill slug={expense.categorySlug}>{expense.category}</CategoryPill>
      <b>{money(expense.amount, expense.currency)}</b>
    </article>
  );
}

export function SummaryMetrics({ summary, totalLabel = "Total spend" }) {
  return (
    <section className="metrics-grid compact-metrics">
      <MetricCard label={totalLabel} value={money(summary.totalSpend)} detail={`${compactNumber(summary.expenseCount)} expenses`} tone="blue" />
      <MetricCard label="Average expense" value={money(summary.averageExpense)} detail="Mean transaction size" tone="primary" />
      <MetricCard label="First expense" value={shortDate(summary.firstExpenseDate)} detail="Oldest matching record" tone="indigo" />
      <MetricCard label="Latest expense" value={shortDate(summary.latestExpenseDate)} detail="Newest matching record" tone="emerald" />
    </section>
  );
}
