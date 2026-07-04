import { PageHeader } from "../../components/DashboardPrimitives.js";
import { getDashboardData } from "../../lib/queries.js";
import { money, shortDate } from "../../lib/format.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function StatusPage() {
  const data = getDashboardData();
  return (
    <>
      <PageHeader kicker="Database status" title="Read-only source health">
        Utility view for freshness, source path, and sanity checks.
      </PageHeader>
      <section className="status-grid">
        <div className="card status-panel"><span>Path</span><strong>{data.db.path}</strong></div>
        <div className="card status-panel"><span>Mode</span><strong>Read-only</strong></div>
        <div className="card status-panel"><span>Records</span><strong>{data.overview.expenseCount}</strong></div>
        <div className="card status-panel"><span>Total</span><strong>{money(data.overview.totalSpend)}</strong></div>
        <div className="card status-panel"><span>Latest expense</span><strong>{shortDate(data.overview.latestExpenseDate)}</strong></div>
        <div className="card status-panel"><span>DB modified</span><strong>{data.db.modifiedAt ? new Date(data.db.modifiedAt).toLocaleString() : "unknown"}</strong></div>
      </section>
    </>
  );
}
