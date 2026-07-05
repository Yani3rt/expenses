import { CategoryBars, Donut, PageHeader, SummaryMetrics } from "../../components/DashboardPrimitives.js";
import CategoryDetailCards from "../../components/CategoryDetailCards.js";
import MonthPicker from "../../components/MonthPicker.js";
import { getSpendingData } from "../../lib/queries.js";
import { monthLabel } from "../../lib/format.js";

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
        Pick a month, or switch to All to see lifetime totals by category.
      </PageHeader>

      <SummaryMetrics summary={data.summary} totalLabel={data.activeMonth === "all" ? "All-time spend" : "Month spend"} />

      <section className="content-grid">
        <CategoryBars categories={data.categories} title="Category totals" label="Spending split" />
        <Donut categories={data.categories} />
        <CategoryDetailCards categories={data.categories} />
      </section>
    </>
  );
}
