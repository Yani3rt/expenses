import { PageHeader } from "../../components/DashboardPrimitives.js";
import TransactionsLedger from "../../components/TransactionsLedger.js";
import TransactionsFilters, { ActiveFilterChips } from "../../components/TransactionsFilters.js";
import { getTransactionsData } from "../../lib/queries.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TransactionsPage({ searchParams }) {
  const params = await searchParams;
  const data = getTransactionsData({
    q: params?.q || "",
    period: params?.period || "this_month",
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
        Search and narrow down the expenses you need.
      </PageHeader>

      <TransactionsFilters meta={data.meta} months={data.months} categories={data.categories} />
      <ActiveFilterChips meta={data.meta} categoryOptions={data.categories} summary={data.summary} />
      <TransactionsLedger initialTransactions={data.transactions} meta={data.meta} summary={data.summary} />
    </>
  );
}
