import { CategoryBars, Donut, PageHeader, SummaryMetrics } from "../../components/DashboardPrimitives.js";
import MonthPicker from "../../components/MonthPicker.js";
import { getSpendingData } from "../../lib/queries.js";
import { money, monthLabel, shortDate } from "../../lib/format.js";
import { categoryTone } from "../../lib/categories.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SpendingPage({ searchParams }) {
  const params = await searchParams;
  const data = getSpendingData({ month: params?.month || undefined });
  const heading = data.activeMonth === "all" ? "All spending" : `Spending in ${monthLabel(data.activeMonth)}`;

  return (
    <>
      <PageHeader
        kicker="Spending by category"
        title={heading}
        action={<MonthPicker months={data.months} activeMonth={data.activeMonth} />}
      >
        Pick a month, or switch to All to see lifetime totals by category.
      </PageHeader>

      <SummaryMetrics summary={data.summary} totalLabel={data.activeMonth === "all" ? "All-time spend" : "Month spend"} />

      <section className="content-grid">
        <CategoryBars categories={data.categories} title="Category totals" label="Spending split" />
        <Donut categories={data.categories} />
        <section className="card span-12">
          <p className="label">Category ledger</p>
          <h2>Ranked categories</h2>
          <div className="category-table">
            {data.categories.map((category, index) => (
              <article key={category.categorySlug}>
                <span className="rank">#{index + 1}</span>
                <span className={`dot tone-${categoryTone(category.categorySlug)}`} />
                <strong>{category.category}</strong>
                <small>{category.expenseCount} expenses · {shortDate(category.firstDate)} → {shortDate(category.latestDate)}</small>
                <b>{money(category.totalSpend)}</b>
              </article>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}
