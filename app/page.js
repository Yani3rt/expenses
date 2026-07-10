import { CategoryBars, ChangeSummary, Donut, ExpenseList, MetricCard, MonthlyTrend, PageHeader } from "../components/DashboardPrimitives.js";
import { getDashboardData } from "../lib/queries.js";
import { compactNumber, money, monthLabel, shortDate } from "../lib/format.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function Home() {
  const data = getDashboardData();
  return (
    <>
      <PageHeader
        kicker={monthLabel(data.month.activeMonth)}
        title="Dashboard"
        action={<span className="readonly-chip"><span className="status-dot" />Read only</span>}
      >
        See this month's spending, biggest categories, recent purchases, and whether the data is up to date.
      </PageHeader>

      <section className="metrics-grid dashboard-summary-metrics">
        <MetricCard label="Month spend" value={money(data.month.totalSpend)} detail={`${compactNumber(data.month.expenseCount)} expenses · avg ${money(data.month.averageExpense)}`} tone="blue" icon="money" />
        <MetricCard
          label={data.comparison.previousMonth ? `Change from ${monthLabel(data.comparison.previousMonth)}` : "Change from prior month"}
          value={`${data.comparison.deltaAmount > 0 ? "+" : ""}${money(data.comparison.deltaAmount)}`}
          detail={data.comparison.deltaPercent === null
            ? "No prior spending"
            : `${compactNumber(Math.abs(data.comparison.deltaPercent))}% ${data.comparison.direction === "up" ? "higher" : data.comparison.direction === "down" ? "lower" : "unchanged"}`}
          tone={data.comparison.direction === "up" ? "coral" : "emerald"}
          icon="chart"
        />
        <MetricCard label="Largest expense this month" value={data.largestExpense ? money(data.largestExpense.amount) : "—"} detail={data.largestExpense ? `${data.largestExpense.description} · ${shortDate(data.largestExpense.date)}` : "No expenses"} tone="primary" icon="alert" />
      </section>

      <ChangeSummary comparison={data.comparison} />

      <section className="content-grid">
        <CategoryBars categories={data.categories} />
        <Donut categories={data.categories} />
        <MonthlyTrend months={data.monthlyTotals} className="span-12" />
        <ExpenseList title="Recent expenses" expenses={data.recentExpenses} className="span-6 dashboard-expense-list" showCategory={false} />
        <ExpenseList title="Largest expenses" expenses={data.largestExpenses} compact className="span-6 dashboard-expense-list" showCategory={false} />
      </section>
    </>
  );
}
