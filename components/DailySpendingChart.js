import { money, shortDate } from "../lib/format.js";

export default function DailySpendingChart({ dailyTotals = [], className = "span-6" }) {
  const totalSpend = dailyTotals.reduce((sum, day) => sum + Number(day.totalSpend || 0), 0);
  const maxSpend = Math.max(...dailyTotals.map((day) => Number(day.totalSpend || 0)), 1);
  const averagePerDay = dailyTotals.length ? totalSpend / dailyTotals.length : 0;
  const peakDay = dailyTotals.reduce(
    (peak, day) => (!peak || Number(day.totalSpend) > Number(peak.totalSpend) ? day : peak),
    null
  );

  return (
    <section className={`card daily-spending-card ${className}`.trim()}>
      <div className="section-head">
        <div>
          <p className="label">Daily spending</p>
          <h2>Spending days this month</h2>
          <p className="daily-spending-lede">Only days with recorded expenses are shown.</p>
        </div>
      </div>

      {dailyTotals.length ? (
        <>
          <div className="daily-spending-bars" style={{ "--spending-day-count": dailyTotals.length }}>
            {dailyTotals.map((day) => (
              <div className="daily-spending-day" key={day.date}>
                <strong>{money(day.totalSpend)}</strong>
                <div className="daily-spending-track">
                  <i style={{ height: `${Math.max((Number(day.totalSpend) / maxSpend) * 100, 6)}%` }} />
                </div>
                <span>{shortDate(day.date)}</span>
              </div>
            ))}
          </div>
          <div className="daily-spending-summary">
            <div><span>Spending days</span><strong>{dailyTotals.length}</strong></div>
            <div><span>Average per spending day</span><strong>{money(averagePerDay)}</strong></div>
            <div><span>Highest day</span><strong>{shortDate(peakDay?.date)} · {money(peakDay?.totalSpend)}</strong></div>
          </div>
        </>
      ) : (
        <p className="empty-state">No spending days recorded this month.</p>
      )}
    </section>
  );
}
