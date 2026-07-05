import { PageHeader, SummaryMetrics } from "../../components/DashboardPrimitives.js";
import TransactionsLedger from "../../components/TransactionsLedger.js";
import TransactionsFilters, { ActiveFilterChips } from "../../components/TransactionsFilters.js";
import { getTransactionsData } from "../../lib/queries.js";

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
    offset: params?.offset || 0,
    limit: params?.limit || 10,
  });

  return (
    <>
      <PageHeader
        className="transactions-page-header"
        kicker="Transactions"
        title="Expense ledger"
        titleClassName="transactions-mobile-hide"
      >
        Search, filter, and sort the expenses that match.
      </PageHeader>

      <TransactionsFilters meta={data.meta} months={data.months} categories={data.categories} />
      <ActiveFilterChips meta={data.meta} categoryOptions={data.categories} />

      <SummaryMetrics summary={data.summary} totalLabel="Filtered spend" />
      <TransactionsLedger initialTransactions={data.transactions} meta={data.meta} summary={data.summary} />
    </>
  );
}
