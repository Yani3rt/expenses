import { ExpenseRow, PageHeader, SummaryMetrics } from "../../components/DashboardPrimitives.js";
import { getTransactionsData } from "../../lib/queries.js";
import { money, monthLabel } from "../../lib/format.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TransactionsPage({ searchParams }) {
  const params = await searchParams;
  const data = getTransactionsData({
    q: params?.q || "",
    month: params?.month || "all",
    category: params?.category || "all",
  });

  return (
    <>
      <PageHeader kicker="Transactions" title="Filtered expense ledger">
        Search descriptions and notes, filter by month or category. Still read-only — just sharper eyes.
      </PageHeader>

      <form className="filter-card wide-filter" action="/transactions">
        <label className="search-field">
          Search
          <input name="q" defaultValue={data.meta.q} placeholder="food, t-mobile, tech…" />
        </label>
        <label>
          Month
          <select name="month" defaultValue={data.meta.month}>
            {data.months.map((month) => <option value={month.value} key={month.value}>{month.label}</option>)}
          </select>
        </label>
        <label>
          Category
          <select name="category" defaultValue={data.meta.category}>
            <option value="all">All categories</option>
            {data.categories.map((category) => <option value={category.slug} key={category.slug}>{category.name}</option>)}
          </select>
        </label>
        <button type="submit">Filter</button>
      </form>

      <SummaryMetrics summary={data.summary} totalLabel="Filtered spend" />

      <section className="card ledger-card">
        <div className="section-head">
          <div>
            <p className="label">Ledger</p>
            <h2>{data.transactions.length} matching transactions</h2>
          </div>
          <span className="readonly-chip">{data.meta.month !== "all" ? monthLabel(data.meta.month) : "All time"}</span>
        </div>
        {data.transactions.length ? (
          <div className="expense-list dense-list">
            {data.transactions.map((expense) => <ExpenseRow expense={expense} key={expense.id} />)}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No expenses match those filters.</strong>
            <span>Broaden the range or clear the search. The DB remains untouched, as promised.</span>
          </div>
        )}
        <div className="ledger-foot">Showing up to 200 rows · {money(data.summary.totalSpend)} total in this view</div>
      </section>
    </>
  );
}
