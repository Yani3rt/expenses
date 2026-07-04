import { CategoryBars, Donut, ExpenseList, MetricCard, MonthlyTrend, PageHeader } from "../components/DashboardPrimitives.js";
import { getDashboardData } from "../lib/queries.js";
import { compactNumber, money, monthLabel, shortDate } from "../lib/format.js";
import { categoryTone } from "../lib/categories.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function Home() {
  const data = getDashboardData();
  return (
    <>
      <PageHeader
        kicker={monthLabel(data.month.activeMonth)}
        title="Dashboard"
        action={<span className="readonly-chip"><span className="status-dot" />READ ONLY</span>}
      >
        Fast read on spending, category pressure, recent transactions, and database freshness.
      </PageHeader>

      <section className="metrics-grid">
        <MetricCard label="Month spend" value={money(data.month.totalSpend)} detail={`${compactNumber(data.month.expenseCount)} expenses · avg ${money(data.month.averageExpense)}`} tone="blue" />
        <MetricCard label="All-time tracked" value={money(data.overview.totalSpend)} detail={`${compactNumber(data.overview.expenseCount)} records since ${shortDate(data.overview.firstExpenseDate)}`} tone="primary" />
        <MetricCard label="Top category" value={data.topCategory?.category || "—"} detail={data.topCategory ? `${money(data.topCategory.totalSpend)} · ${data.topCategory.expenseCount} expenses` : "No category data"} tone={categoryTone(data.topCategory?.categorySlug)} />
        <MetricCard label="Largest expense" value={data.largestExpense ? money(data.largestExpense.amount) : "—"} detail={data.largestExpense ? `${data.largestExpense.description} · ${shortDate(data.largestExpense.date)}` : "No expenses"} tone="coral" />
      </section>

      <section className="content-grid">
        <CategoryBars categories={data.categories} />
        <Donut categories={data.categories} />
        <ExpenseList title="Recent expenses" expenses={data.recentExpenses} />
        <ExpenseList title="Largest expenses" expenses={data.largestExpenses} compact />
        <MonthlyTrend months={data.monthlyTotals} />
      </section>
    </>
  );
}
