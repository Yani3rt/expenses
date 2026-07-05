import { CategoryBars, Donut, MetricCard, PageHeader } from "../../components/DashboardPrimitives.js";
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
        Pick a month to compare category spending.
      </PageHeader>

      <section className="metrics-grid compact-metrics spending-summary-metrics distilled-spending-metrics">
        <MetricCard
          label={data.activeMonth === "all" ? "All-time spend" : "Month spend"}
          value={money(data.summary.totalSpend)}
          detail={`${data.summary.expenseCount} expenses`}
          tone="blue"
          icon="money"
        />
        <MetricCard
          label="Average expense"
          value={money(data.summary.averageExpense)}
          detail="Typical expense size"
          tone="primary"
          icon="chart"
        />
      </section>

      <section className="content-grid">
        <CategoryBars categories={data.categories} title="Category totals" label="Spending split" />
        <Donut categories={data.categories} />
        <CategoryDetailCards categories={data.categories} />
      </section>
    </>
  );
}
