import { ExpenseRow, PageHeader, SummaryMetrics } from "../../components/DashboardPrimitives.js";
import TransactionsFilters, { ActiveFilterChips } from "../../components/TransactionsFilters.js";
import { getTransactionsData } from "../../lib/queries.js";
import { money, monthLabel } from "../../lib/format.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TransactionsPage({ searchParams }) {
  const params = await searchParams;
  const data = getTransactionsData({
    q: params?.q || "",
    period: params?.period || "all",
    month: params?.month || "all",
    category: params?.category || "all",
    sort: params?.sort || "newest",
  });

  return (
    <>
      <PageHeader
        className="transactions-page-header"
        kicker="Transactions"
        title="Filtered expense ledger"
        titleClassName="transactions-mobile-hide"
      >
      </PageHeader>

      <TransactionsFilters meta={data.meta} months={data.months} categories={data.categories} />
      <ActiveFilterChips meta={data.meta} categoryOptions={data.categories} />

      <SummaryMetrics summary={data.summary} totalLabel="Filtered spend" />

      <section className="card ledger-card">
        <div className="section-head">
          <div>
            <p className="label">Ledger</p>
            <h2>{data.transactions.length} matching transactions</h2>
          </div>
          <span className="readonly-chip">
            {data.meta.month !== "all"
              ? monthLabel(data.meta.month)
              : data.meta.periodLabel}
          </span>
        </div>
        {data.transactions.length ? (
          <div className="expense-list dense-list">
            {data.transactions.map((expense) => <ExpenseRow expense={expense} key={expense.id} />)}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No expenses match those filters.</strong>
            <span>Try a broader date range, remove a chip, or clear all filters. The DB remains untouched, as promised.</span>
            <a className="clear-filters-link" href="/transactions">Reset filters</a>
          </div>
        )}
        <div className="ledger-foot">Showing up to 200 rows · {money(data.summary.totalSpend)} total in this view</div>
      </section>
    </>
  );
}
