"use client";

import { useMemo, useState } from "react";
import RangeTabs from "@/components/RangeTabs";
import { AreaChart } from "@/components/dither-kit/area-chart";
import { Area } from "@/components/dither-kit/area";
import { BarChart } from "@/components/dither-kit/bar-chart";
import { Bar } from "@/components/dither-kit/bar";
import { Legend } from "@/components/dither-kit/legend";
import { Tooltip } from "@/components/dither-kit/tooltip";
import { XAxis } from "@/components/dither-kit/x-axis";
import { YAxis } from "@/components/dither-kit/y-axis";
import { money } from "@/lib/format";
import { currentWeekBounds } from "@/lib/date-range";
import { buildCumulativeData, buildMonthlyData, buildDailyData } from "@/lib/spending-chart-data";

const DAILY_RANGE_OPTIONS = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const cumulativeConfig = {
  current: { label: "Current month", color: "blue" , interactive: true },
  previous: { label: "Previous month", color: "purple" },
};

const monthlyConfig = {
  totalSpend: { label: "Amount", color: "blue" },
};

const dailyConfig = {
  totalSpend: { label: "Day Amount", color: "green" },
};

function ChartCard({ id, title, action = null, children }) {
  return (
    <article className="card span-12 dither-chart-card" aria-labelledby={id}>
      <header className="section-head">
        <h2 id={id}>{title}</h2>
        {action}
      </header>
      <div className="dither-chart-stage">{children}</div>
    </article>
  );
}

export default function DitheredSpendingCharts({ monthlyTotals, dailyTotals, previousDailyTotals }) {
  const [dailyRange, setDailyRange] = useState("month");
  const [today] = useState(() => new Date());
  const weekBounds = useMemo(() => currentWeekBounds(today), [today]);
  const cumulativeData = useMemo(() => buildCumulativeData(dailyTotals, previousDailyTotals), [dailyTotals, previousDailyTotals]);
  const monthlyData = useMemo(() => buildMonthlyData(monthlyTotals), [monthlyTotals]);
  const visibleDailyData = useMemo(
    () => buildDailyData(dailyTotals, dailyRange, weekBounds),
    [dailyRange, dailyTotals, weekBounds]
  );

  return (
    <>
        <ChartCard id="cumulative-spend-title" title="Cumulative daily spend">
          <AreaChart data={cumulativeData} config={cumulativeConfig} bloom="aura" margins={{ top: 42, left: 68 }} tapToPinTooltip>
            <XAxis dataKey="day" />
            <YAxis tickFormatter={(value) => money(value)} />
            <Legend isClickable />
            <Tooltip labelKey="day" hideSeriesLabels valueFormatter={(value) => money(value)} />
            <Area dataKey="previous" variant="dotted" />
            <Area dataKey="current" variant="gradient" />
          </AreaChart>
        </ChartCard>

        <ChartCard id="monthly-spend-title" title="Monthly spending history">
          <BarChart data={monthlyData} config={monthlyConfig} bloom="aura" margins={{ top: 42, left: 16 }} tapToPinTooltip>
            <XAxis dataKey="label" />
            <Legend isClickable />
            <Tooltip labelKey="month" valueFormatter={(value) => money(value)} />
            <Bar isClickable dataKey="totalSpend" variant="dotted" />
          </BarChart>
        </ChartCard>

        <ChartCard
          id="daily-spend-title"
          title="Daily spending"
          action={(
            <RangeTabs
              options={DAILY_RANGE_OPTIONS}
              value={dailyRange}
              onChange={setDailyRange}
              label="Daily spending period"
              className="spending-range-tabs"
            />
          )}
        >
          <AreaChart data={visibleDailyData} config={dailyConfig} bloom="aura" margins={{ left: 68 }} tapToPinTooltip>
            <XAxis dataKey="day" />
            <YAxis tickFormatter={(value) => money(value)} />
            <Tooltip labelKey="date" valueFormatter={(value) => money(value)} />
            <Area dataKey="totalSpend" variant="gradient" />
          </AreaChart>
        </ChartCard>
    </>
  );
}
