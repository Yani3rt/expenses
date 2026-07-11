"use client";

import { cloneElement, useEffect, useRef, useState } from "react";
import { AreaChart } from "@/components/dither-kit/area-chart";
import { Area } from "@/components/dither-kit/area";
import { BarChart } from "@/components/dither-kit/bar-chart";
import { Bar } from "@/components/dither-kit/bar";
import { Legend } from "@/components/dither-kit/legend";
import { Tooltip } from "@/components/dither-kit/tooltip";
import { XAxis } from "@/components/dither-kit/x-axis";
import { YAxis } from "@/components/dither-kit/y-axis";
import { money } from "@/lib/format";

const cumulativeConfig = {
  current: { label: "Current month", color: "blue" },
  previous: { label: "Previous month", color: "grey" },
};

const monthlyConfig = {
  totalSpend: { label: "Monthly spend", color: "purple" },
};

const dailyConfig = {
  totalSpend: { label: "Daily spend", color: "green" },
};

function dayNumber(date) {
  return Number.parseInt(date.slice(-2), 10);
}

function buildCumulativeData(currentRows, previousRows) {
  const currentByDay = new Map(currentRows.map((row) => [dayNumber(row.date), row.totalSpend]));
  const previousByDay = new Map(previousRows.map((row) => [dayNumber(row.date), row.totalSpend]));
  const lastDay = Math.max(1, ...currentByDay.keys(), ...previousByDay.keys());
  let current = 0;
  let previous = 0;

  return Array.from({ length: lastDay }, (_, index) => {
    const day = index + 1;
    current += currentByDay.get(day) || 0;
    previous += previousByDay.get(day) || 0;
    return { day: `${day}`, current, previous };
  });
}

function ChartCard({ id, title, description, children }) {
  const cardRef = useRef(null);
  const wasVisibleRef = useRef(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [replayToken, setReplayToken] = useState(0);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !wasVisibleRef.current) {
        setHasEntered(true);
        setReplayToken((token) => token + 1);
      }
      wasVisibleRef.current = entry.isIntersecting;
    }, { threshold: 0.25 });

    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <article ref={cardRef} className="card span-12 dither-chart-card" aria-labelledby={id}>
      <header className="section-head">
        <div>
          <p className="label">Dithered view</p>
          <h2 id={id}>{title}</h2>
          <p className="dither-chart-lede">{description}</p>
        </div>
      </header>
      <div className="dither-chart-stage">
        {cloneElement(children, {
          animate: hasEntered,
          animationDuration: 1000,
          replayToken,
          key: hasEntered ? id : `${id}-idle`,
        })}
      </div>
    </article>
  );
}

export default function DitheredSpendingCharts({ monthlyTotals, dailyTotals, previousDailyTotals }) {
  const cumulativeData = buildCumulativeData(dailyTotals, previousDailyTotals);
  const monthlyData = monthlyTotals.slice(-12).map((row) => ({
    ...row,
    label: row.month.slice(5),
  }));
  const dailyData = dailyTotals.map((row) => ({
    ...row,
    day: `${dayNumber(row.date)}`,
  }));

  return (
    <>
        <ChartCard id="cumulative-spend-title" title="Cumulative daily spend" description="Current month compared with the previous month.">
          <AreaChart data={cumulativeData} config={cumulativeConfig} bloom="aura" margins={{ top: 42, left: 68 }}>
            <XAxis dataKey="day" />
            <YAxis tickFormatter={(value) => money(value)} />
            <Legend isClickable />
            <Tooltip labelKey="day" valueFormatter={(value) => money(value)} />
            <Area dataKey="previous" variant="hatched" />
            <Area dataKey="current" variant="gradient" />
          </AreaChart>
        </ChartCard>

        <ChartCard id="monthly-spend-title" title="Monthly spending history" description="The latest twelve months in one view.">
          <BarChart data={monthlyData} config={monthlyConfig} bloom="aura" margins={{ top: 42, left: 16 }}>
            <XAxis dataKey="label" />
            <Legend isClickable />
            <Tooltip labelKey="month" valueFormatter={(value) => money(value)} />
            <Bar dataKey="totalSpend" variant="dotted" />
          </BarChart>
        </ChartCard>

        <ChartCard id="daily-spend-title" title="Daily spending" description="Each active day in the latest month.">
          <AreaChart data={dailyData} config={dailyConfig} bloom="high" margins={{ left: 68 }}>
            <XAxis dataKey="day" />
            <YAxis tickFormatter={(value) => money(value)} />
            <Tooltip labelKey="date" valueFormatter={(value) => money(value)} />
            <Area dataKey="totalSpend" variant="gradient" />
          </AreaChart>
        </ChartCard>
    </>
  );
}
