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
        action={<span className="readonly-chip"><span className="status-dot" />Read only</span>}
      >
        See this month's spending, biggest categories, recent purchases, and whether the data is up to date.
      </PageHeader>

      <section className="metrics-grid dashboard-summary-metrics">
        <MetricCard label="Month spend" value={money(data.month.totalSpend)} detail={`${compactNumber(data.month.expenseCount)} expenses · avg ${money(data.month.averageExpense)}`} tone="blue" icon="money" />
        <MetricCard label="Lifetime spend" value={money(data.overview.totalSpend)} detail={`${compactNumber(data.overview.expenseCount)} records since ${shortDate(data.overview.firstExpenseDate)}`} tone="primary" icon="database" />
        <MetricCard label="Top category" value={data.topCategory?.category || "—"} detail={data.topCategory ? `${money(data.topCategory.totalSpend)} · ${data.topCategory.expenseCount} expenses` : "No category data"} tone={categoryTone(data.topCategory?.categorySlug)} icon="tag" />
        <MetricCard label="Biggest expense" value={data.largestExpense ? money(data.largestExpense.amount) : "—"} detail={data.largestExpense ? `${data.largestExpense.description} · ${shortDate(data.largestExpense.date)}` : "No expenses"} tone="coral" icon="alert" />
      </section>

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
