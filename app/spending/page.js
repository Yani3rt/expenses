import { MetricCard, PageHeader } from "../../components/DashboardPrimitives.js";
import CategoryComparison from "../../components/CategoryComparison.js";
import CategoryDetailCards from "../../components/CategoryDetailCards.js";
import MonthPicker from "../../components/MonthPicker.js";
import { getSpendingData } from "../../lib/queries.js";
import { money, monthLabel } from "../../lib/format.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SpendingPage({ searchParams }) {
  const params = await searchParams;
  const data = getSpendingData({ month: params?.month || undefined });
  const heading = data.activeMonth === "all" ? "All spending" : `Spending in ${monthLabel(data.activeMonth)}`;
  const detailPeriodLabel = data.activeMonth === "all" ? "all recorded spending" : monthLabel(data.activeMonth);
  const changeDetail = data.comparison.deltaPercent === null
    ? "No prior spending"
    : `${Math.abs(data.comparison.deltaPercent).toFixed(0)}% ${data.comparison.deltaAmount > 0 ? "higher" : data.comparison.deltaAmount < 0 ? "lower" : "unchanged"}`;

  return (
    <>
      <PageHeader
        className="spending-page-header"
        kicker="Spending by category"
        title={heading}
        titleClassName="spending-mobile-hide"
        ledeClassName="spending-mobile-hide"
        animateTitleOnChange
        titleAnimationKey={data.activeMonth}
        action={<MonthPicker months={data.months} activeMonth={data.activeMonth} />}
      >
        {data.comparison.mode === "comparison"
          ? "Compare each category with the previous month."
          : "Browse category totals across all recorded spending."}
      </PageHeader>

      <section className="metrics-grid compact-metrics spending-summary-metrics distilled-spending-metrics">
        <MetricCard
          label={data.activeMonth === "all" ? "All-time spend" : "Month spend"}
          value={money(data.summary.totalSpend)}
          detail={`${data.summary.expenseCount} expenses`}
          tone="blue"
          icon="money"
        />
        {data.comparison.mode === "comparison" ? (
          <MetricCard
            label={`Change from ${monthLabel(data.previousMonth)}`}
            value={`${data.comparison.deltaAmount > 0 ? "+" : ""}${money(data.comparison.deltaAmount)}`}
            detail={changeDetail}
            tone={data.comparison.deltaAmount > 0 ? "coral" : "emerald"}
            icon="chart"
          />
        ) : (
          <MetricCard
            label="Average expense"
            value={money(data.summary.averageExpense)}
            detail="Typical expense size"
            tone="primary"
            icon="chart"
          />
        )}
      </section>

      <section className="content-grid">
        <CategoryComparison comparison={data.comparison} />
        <CategoryDetailCards categories={data.categories} periodLabel={detailPeriodLabel} />
      </section>
    </>
  );
}
