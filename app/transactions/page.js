import { PageHeader } from "../../components/DashboardPrimitives.js";
import TransactionsLedger from "../../components/TransactionsLedger.js";
import TransactionsFilters from "../../components/TransactionsFilters.js";
import { getTransactionsData } from "../../lib/queries.js";
import { normalizeCategoryValues, transactionsRouteIdentity } from "../../lib/transaction-filters.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TransactionsPage({ searchParams }) {
  const params = await searchParams;
  const sourceRouteIdentity = transactionsRouteIdentity(params);
  const data = getTransactionsData({
    q: params?.q || "",
    period: params?.period || "this_month",
    month: params?.month || "all",
    categories: normalizeCategoryValues(params?.category),
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
      />

      <TransactionsFilters
        meta={data.meta}
        months={data.months}
        categories={data.categories}
        sourceRouteIdentity={sourceRouteIdentity}
        summary={data.summary}
      />
      <TransactionsLedger initialTransactions={data.transactions} meta={data.meta} summary={data.summary} />
    </>
  );
}
