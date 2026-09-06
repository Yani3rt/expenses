import { ChangeSummary, ExpenseList, MetricCard, PageHeader } from "../components/DashboardPrimitives.js";
import InteractiveDonut from "../components/InteractiveDonut.js";
import InteractiveLargestExpenses from "../components/InteractiveLargestExpenses.js";
import DitheredSpendingCharts from "../components/DitheredSpendingCharts.js";
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
      />

      <section className="metrics-grid dashboard-summary-metrics">
        <MetricCard label="Month spend" value={money(data.month.totalSpend)} detail={`${compactNumber(data.month.expenseCount)} expenses · avg ${money(data.month.averageExpense)}`} tone="blue" icon="money" sparklineData={data.dailyTotals} animateValue />
        <MetricCard
          label={data.comparison.previousMonth ? `Change from ${monthLabel(data.comparison.previousMonth)}` : "Change from prior month"}
          value={`${data.comparison.deltaAmount > 0 ? "+" : ""}${money(data.comparison.deltaAmount)}`}
          detail={data.comparison.deltaPercent === null
            ? "No prior spending"
            : `${compactNumber(Math.abs(data.comparison.deltaPercent))}% ${data.comparison.direction === "up" ? "higher" : data.comparison.direction === "down" ? "lower" : "unchanged"}`}
          tone={data.comparison.direction === "up" ? "coral" : "emerald"}
          icon="chart"
          animateValue
        />
        <MetricCard label="Largest expense this month" value={data.largestExpense ? money(data.largestExpense.amount) : "—"} detail={data.largestExpense ? `${data.largestExpense.description} · ${shortDate(data.largestExpense.date)}` : "No expenses"} tone="primary" icon="alert" animateValue />
      </section>

      <ChangeSummary comparison={data.comparison} />

      <section className="content-grid">
        <section className="dashboard-category-row">
          <ExpenseList title="Recent spending" expenses={data.recentExpenses} className="span-7 dashboard-recent-spending" showCategory={false} />
          <InteractiveDonut categories={data.categories} />
        </section>
        <InteractiveLargestExpenses expensesByRange={data.largestExpensesByRange} className="span-12 dashboard-expense-list" />
        <DitheredSpendingCharts
          monthlyTotals={data.monthlyTotals}
          dailyTotals={data.dailyTotals}
          previousDailyTotals={data.previousDailyTotals}
        />
      </section>
    </>
  );
}
