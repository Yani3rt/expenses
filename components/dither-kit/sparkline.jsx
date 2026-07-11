"use client";
import { Area } from "./area"
import { AreaChart } from "./area-chart"

/**
 * Thin wrapper over {@link AreaChart} for the decorative-sparkline case: a
 * single `number[]` series, no axes/grid/tooltip, no scrub crosshair (unless a
 * `markerIndex` is supplied). Keeps the hover brightness lift.
 */
export function Sparkline({
  data,
  color,
  variant = "gradient",
  markerIndex = null,
  hovered = false,
  bloom = "off",
  bloomOnHover = false,
  animate = false,
  className
}) {
  // React Compiler memoizes these against `data` / `color`.
  const rows = data.map((v) => ({ v }))
  const config = { v: { color } }

  return (
    <AreaChart
      data={rows}
      config={config}
      interactive={false}
      animate={animate}
      markerIndex={markerIndex}
      hovered={hovered}
      bloom={bloom}
      bloomOnHover={bloomOnHover}
      margins={{ top: 0, right: 0, bottom: 0, left: 0 }}
      className={className}>
      <Area dataKey="v" variant={variant} />
    </AreaChart>
  );
}
