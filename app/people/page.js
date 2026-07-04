import { PageHeader } from "../../components/DashboardPrimitives.js";
import { getPeopleData } from "../../lib/queries.js";
import { money } from "../../lib/format.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function PeoplePage() {
  const data = getPeopleData();
  return (
    <>
      <PageHeader kicker="People" title="Who paid and who owns the spend">
        The database supports paid-by and allocations. Today it mostly behaves like a single-person ledger, but the split model is ready.
      </PageHeader>
      <section className="content-grid">
        <section className="card span-6">
          <p className="label">Paid by</p>
          <h2>Payment source</h2>
          <div className="people-stack">
            {data.people.map((person) => (
              <article key={person.slug}>
                <span>{person.person}</span>
                <strong>{money(person.totalPaid)}</strong>
                <small>{person.expenseCount} expenses</small>
              </article>
            ))}
          </div>
        </section>
        <section className="card span-6">
          <p className="label">Allocated to</p>
          <h2>Ownership split</h2>
          <div className="people-stack">
            {data.allocations.map((person) => (
              <article key={person.slug}>
                <span>{person.person}</span>
                <strong>{money(person.allocatedTotal)}</strong>
                <small>{person.allocationCount} allocations</small>
              </article>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}
