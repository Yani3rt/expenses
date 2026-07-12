import Link from "next/link";
import InteractiveDonut from "./InteractiveDonut.js";
import InteractiveMonthlyTrend from "./InteractiveMonthlyTrend.js";
import AnimatedText from "./AnimatedText.js";
import { AppIcon, CategoryIcon } from "./Icons.js";
import { categoryTone } from "../lib/categories.js";
import { compactNumber, money, monthLabel, shortDate } from "../lib/format.js";

export function PageHeader({ kicker, title, children, action, className = "", titleClassName = "", ledeClassName = "", animateTitleOnChange = true, titleAnimationKey }) {
  return (
    <header className={`page-header ${className}`.trim()}>
      <div>
        <p className="label">{kicker}</p>
        <h1 className={`${titleClassName}${animateTitleOnChange ? " title-animates-on-change" : ""}`.trim()}>{animateTitleOnChange ? <span className="page-title-copy" key={titleAnimationKey ?? title}>{title}</span> : title}</h1>
        {children ? <p className={`lede ${ledeClassName}`.trim()}>{children}</p> : null}
      </div>
      {action ? <div className="page-action">{action}</div> : null}
    </header>
  );
}

function MetricSparkline({ data }) {
  const values = data.map((item) => Number(item.totalSpend || 0)).filter((value) => value > 0);
  if (values.length < 2) return null;

  const max = Math.max(...values, 1);
  const linePoints = values.map((value, index) => {
    const x = 4 + (index * 92) / (values.length - 1);
    const y = 42 - (value / max) * 34;
    return `${x},${y}`;
  }).join(" ");
  const areaPoints = `4,48 ${linePoints} 96,48`;

  return (
    <svg className="metric-sparkline" viewBox="0 0 100 48" preserveAspectRatio="none" aria-hidden="true">
      <polygon points={areaPoints} />
      <polyline points={linePoints} />
    </svg>
  );
}

export function MetricCard({ label, value, detail, tone = "primary", icon = "dashboard", sparklineData = null, animateValue = false }) {
  return (
    <section className={`card metric tone-${tone}`}>
      {sparklineData?.length ? <MetricSparkline data={sparklineData} /> : null}
      <div className="metric-head">
        <p className="label">{label}</p>
        <span className="metric-icon" aria-hidden="true">
          <AppIcon name={icon} />
        </span>
      </div>
      {animateValue ? <AnimatedText as="strong">{value}</AnimatedText> : <strong>{value}</strong>}
      <span>{detail}</span>
    </section>
  );
}

function ChangeSignal({ direction, children }) {
  const arrow = direction === "down" ? "↓" : direction === "up" ? "↑" : "→";
  return (
    <strong className={`change-signal is-${direction}`}>
      <span className="change-signal-arrow" aria-hidden="true">{arrow}</span>
      {children}
    </strong>
  );
}

function comparisonNarrative(comparison) {
  if (!comparison?.currentMonth || comparison.direction === "none") {
    return "Once another month is recorded, you’ll see the comparison here.";
  }

  const previousLabel = monthLabel(comparison.previousMonth);
  if (comparison.previousTotal === 0) {
    const driver = comparison.primaryDriver
      ? ` ${comparison.primaryDriver.category} led the way at ${money(Math.abs(comparison.primaryDriver.deltaAmount))}.`
      : "";
    return `${monthLabel(comparison.currentMonth)} gives you a fresh starting point.${driver}`;
  }

  if (comparison.direction === "flat") {
    return <>You landed <ChangeSignal direction="flat">about the same</ChangeSignal> as you did in {previousLabel}.</>;
  }

  const directionWord = comparison.direction === "up" ? "more" : "less";
  const percent = comparison.deltaPercent === null
    ? ""
    : ` · ${compactNumber(Math.abs(comparison.deltaPercent))}%`;
  const mainDriver = comparison.direction === "up" ? comparison.primaryDriver : comparison.offsetDriver;
  const driverCopy = mainDriver
    ? comparison.direction === "up"
      ? <> {mainDriver.category} led the increase at <ChangeSignal direction="up">{money(Math.abs(mainDriver.deltaAmount))}</ChangeSignal>.</>
      : <> {mainDriver.category} made the biggest difference, down <ChangeSignal direction="down">{money(Math.abs(mainDriver.deltaAmount))}</ChangeSignal>.</>
    : "";
  const offsetCopy = comparison.direction === "up" && comparison.offsetDriver
    ? <> {comparison.offsetDriver.category} helped offset that, down <ChangeSignal direction="down">{money(Math.abs(comparison.offsetDriver.deltaAmount))}</ChangeSignal>.</>
    : "";

  return (
    <>
      You spent <ChangeSignal direction={comparison.direction}>{money(Math.abs(comparison.deltaAmount))}{percent}</ChangeSignal> {directionWord} than in {previousLabel}.
      {driverCopy}
      {offsetCopy}
    </>
  );
}

function comparisonHeadline(comparison) {
  if (!comparison?.currentMonth || comparison.direction === "none") return "More history needed";
  if (comparison.previousTotal === 0) return "A fresh starting point";
  if (comparison.direction === "down") return "A lighter month";
  if (comparison.direction === "up") return "Spending picked up";
  if (comparison.direction === "flat") return "Holding steady.";
  return "This month at a glance";
}

export function ChangeSummary({ comparison }) {
  const currentMonth = comparison?.currentMonth || "all";
  return (
    <section className="change-summary" aria-labelledby="change-summary-title">
      <div className="change-summary-copy">
        <h2 id="change-summary-title">{comparisonHeadline(comparison)}</h2>
        <p>{comparisonNarrative(comparison)}</p>
      </div>
      <Link className="change-summary-action dashboard-delight-action" href={`/transactions?month=${encodeURIComponent(currentMonth)}`}>
        Explore this month <span className="dashboard-action-arrow" aria-hidden="true">→</span>
      </Link>
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

export function CategoryBars({ categories, title = "Category totals", label = "Spending breakdown" }) {
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
              <small>{category.expenseCount} expenses</small>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function Donut({ categories }) {
  return <InteractiveDonut categories={categories} />;
}

export function MonthlyTrend({ months, className = "span-5" }) {
  return <InteractiveMonthlyTrend months={months} className={className} />;
}

export function ExpenseList({ title, expenses, compact = false, className = "", showCategory = true }) {
  return (
    <section className={`card ${className || (compact ? "span-5" : "span-7")}`.trim()}>
      <div className="section-head">
        <div>
          <p className="label">{compact ? "Highest amounts" : "Recent spending"}</p>
          <h2>{title}</h2>
        </div>
        {!compact ? <Link className="share-reset dashboard-ledger-link dashboard-delight-action" href="/transactions">Open ledger <span className="dashboard-action-arrow" aria-hidden="true">→</span></Link> : null}
      </div>
      <div className="expense-list">
        {expenses.map((expense) => <ExpenseRow expense={expense} showCategory={showCategory} key={`${title}-${expense.id}`} />)}
      </div>
    </section>
  );
}

export function ExpenseRow({ expense, className = "", showCategory = true, onClick }) {
  const RowElement = onClick ? "button" : "article";
  return (
    <RowElement
      className={`expense-row${onClick ? " ledger-row-button" : ""}${expense.notes ? " has-note" : ""} ${className}`.trim()}
      onClick={onClick}
      type={onClick ? "button" : undefined}
    >
      <span className={`expense-icon tone-${categoryTone(expense.categorySlug)}`}>
        <CategoryIcon slug={expense.categorySlug} />
      </span>
      <span className="expense-copy">
        <strong>{expense.description}</strong>
        <span className="expense-meta">{shortDate(expense.date)} · {expense.paidBy}</span>
        {expense.notes ? <small className="expense-note">{expense.notes}</small> : null}
      </span>
      {showCategory ? <CategoryPill slug={expense.categorySlug}>{expense.category}</CategoryPill> : null}
      <b className="expense-amount">{money(expense.amount, expense.currency)}</b>
    </RowElement>
  );
}

export function SummaryMetrics({ summary, totalLabel = "Total spend", className = "" }) {
  return (
    <section className={`metrics-grid compact-metrics ${className}`.trim()}>
      <MetricCard label={totalLabel} value={money(summary.totalSpend)} detail={`${compactNumber(summary.expenseCount)} expenses`} tone="blue" icon="money" />
      <MetricCard label="Average expense" value={money(summary.averageExpense)} detail="Typical expense size" tone="primary" icon="chart" />
      <MetricCard label="First expense" value={shortDate(summary.firstExpenseDate)} detail="Earliest matching expense" tone="indigo" icon="calendar" />
      <MetricCard label="Latest expense" value={shortDate(summary.latestExpenseDate)} detail="Most recent matching expense" tone="emerald" icon="clock" />
    </section>
  );
}
