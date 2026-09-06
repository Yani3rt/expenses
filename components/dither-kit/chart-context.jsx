"use client";
import { createContext, use, useCallback, useMemo, useState } from "react"
import { seedOfColor } from "./palette"
import {
  buildBandScale,
  buildXScale,
  buildYScale,
  computeBands,
  indexAtBand,
  nearestIndex,
} from "./scales";

const ChartContext = createContext(null)

const ROOT_OF = {
  area: "<AreaChart />",
  bar: "<BarChart />",
  line: "<LineChart />",
  pie: "<PieChart />",
  radar: "<RadarChart />",
}

/** Generic accessor for internal layers (canvas/overlay) that work for any root. */
export function useChart() {
  const ctx = use(ChartContext)
  if (!ctx) {
    throw new Error("Chart parts must be used within a chart root (e.g. <AreaChart />).")
  }
  return ctx
}

/**
 * Boundary guard for a composable part. Throws a precise error when used outside
 * a root, or inside the wrong chart type — e.g. `<Bar />` placed in an area
 * chart. `kind` omitted means the part works under any root (grid, axes, …).
 */
export function useChartPart(part, kind) {
  const ctx = use(ChartContext)
  if (!ctx) {
    const where = kind
      ? ROOT_OF[Array.isArray(kind) ? kind[0] : kind]
      : "a chart root"
    throw new Error(`<${part} /> must be used within ${where}.`)
  }
  if (kind) {
    const allowed = Array.isArray(kind) ? kind : [kind]
    if (!allowed.includes(ctx.chartType)) {
      throw new Error(
        `<${part} /> is not valid inside ${ROOT_OF[ctx.chartType]} — it belongs in ${allowed
          .map((k) => ROOT_OF[k])
          .join(" or ")}.`
      )
    }
  }
  return ctx
}

export { ChartContext }

/**
 * Builds the shared context value: resolves the plot rect from the measured
 * size minus margins, computes the x/y scales and the per-series stack bands,
 * and owns the selection + hover state every part reads.
 */
export function useChartController(
  {
    chartType,
    data,
    config,
    stackType,
    dimensions,
    margins,
    markerIndex = null,
    hovered = false,
    bloom = "off",
    bloomOnHover = false,
    defaultSelectedDataKey = null,
    onSelectionChange
  }
) {
  const configKeys = useMemo(() => Object.keys(config), [config])

  const [selectedDataKey, setSelectedDataKey] = useState(defaultSelectedDataKey)
  const [focusDataKey, setFocusDataKey] = useState(null)
  const [hoverIndex, setHoverIndex] = useState(null)
  const [cursorX, setCursorX] = useState(0)
  const [isMouseInChart, setMouseInChart] = useState(false)
  const [seriesSpecs, setSeriesSpecs] = useState({})

  const registerSeries = useCallback((spec) => {
    setSeriesSpecs((prev) => {
      const cur = prev[spec.dataKey]
      return cur &&
        cur.kind === spec.kind &&
        cur.variant === spec.variant &&
        cur.strokeVariant === spec.strokeVariant
        ? prev
        : { ...prev, [spec.dataKey]: spec }
    })
  }, [])
  const unregisterSeries = useCallback((dataKey) => {
    setSeriesSpecs((prev) => {
      if (!(dataKey in prev)) return prev
      const next = { ...prev }
      delete next[dataKey]
      return next
    })
  }, [])

  const selectDataKey = useCallback((key) => {
    setSelectedDataKey(key)
    onSelectionChange?.(key)
  }, [onSelectionChange])

  const plotWidth = Math.max(0, dimensions.width - margins.left - margins.right)
  const plotHeight = Math.max(0, dimensions.height - margins.top - margins.bottom)
  const ready = plotWidth > 0 && plotHeight > 0

  const { bands, max } = useMemo(() => computeBands(data, configKeys, stackType), [data, configKeys, stackType])

  const isBar = chartType === "bar"
  const xPoint = useMemo(() => buildXScale(data.length, plotWidth), [data.length, plotWidth])
  const xBand = useMemo(() => buildBandScale(data.length, plotWidth), [data.length, plotWidth])
  const bandwidth = isBar ? xBand.bandwidth() : 0
  const xCenter = useCallback((i) =>
    isBar ? (xBand(i) ?? 0) + xBand.bandwidth() / 2 : (xPoint(i) ?? 0), [isBar, xBand, xPoint])
  const indexAtX = useCallback((px) =>
    isBar
      ? indexAtBand(px, data.length, plotWidth)
      : nearestIndex(px, data.length, plotWidth), [isBar, data.length, plotWidth])
  const stacked = stackType === "stacked" || stackType === "percent"
  const barSlot = useCallback((i, si, n) => {
    const center = xCenter(i)
    if (stacked) {
      const w = bandwidth * 0.9
      return { x: center - w / 2, width: w }
    }
    const slot = bandwidth / Math.max(n, 1)
    return {
      x: center - bandwidth / 2 + si * slot + slot * 0.08,
      width: slot * 0.84,
    }
  }, [xCenter, stacked, bandwidth])
  const y = useMemo(() => buildYScale(max, plotHeight), [max, plotHeight])

  const seedOf = useCallback((key) => seedOfColor(config[key]?.color ?? "grey"), [config])

  const common = {
    names: configKeys,
    labelOf: (n) => config[n]?.label ?? n,
    seedOf,
    selectedDataKey,
    selectDataKey,
    focusDataKey,
    setFocusDataKey,
    hoverIndex,
    ready,
    tooltipLeft: Math.max(48, Math.min(plotWidth + margins.left - 48, cursorX)),
    // Follow the highest hovered node so the card rides the data path, but
    // keep enough headroom that the upward-lifted card never clips the top.
    tooltipTop: (() => {
      const floor = margins.top + 44
      if (hoverIndex == null) return floor
      let minY = Number.POSITIVE_INFINITY
      for (const key of configKeys) {
        const b = bands[key]?.[hoverIndex]
        if (b) minY = Math.min(minY, y(b[1]))
      }
      if (!Number.isFinite(minY)) return floor
      return Math.max(floor, margins.top + minY);
    })(),
    heading: (i, labelKey) =>
      labelKey ? String(data[i]?.[labelKey] ?? "") : null,
    itemsAt: (i) =>
      configKeys.map((name) => {
        const raw = data[i]?.[name]
        return {
          name,
          label: config[name]?.label ?? name,
          value: typeof raw === "number" ? raw : 0,
          seed: seedOf(name),
          dimmed: (() => {
            const emphasis = selectedDataKey ?? focusDataKey
            return emphasis !== null && emphasis !== name
          })(),
        };
      }),
  }

  return {
    chartType,
    config,
    configKeys,
    data,
    dataLength: data.length,
    stackType,
    margins,
    plot: { width: plotWidth, height: plotHeight },
    ready,
    xCenter,
    bandwidth,
    indexAtX,
    barSlot,
    y,
    bands,
    max,
    selectedDataKey,
    selectDataKey,
    focusDataKey,
    setFocusDataKey,
    hoverIndex,
    setHoverIndex,
    markerIndex,
    cursorX,
    setCursorX,
    isMouseInChart,
    setMouseInChart,
    hovered,
    bloom,
    bloomOnHover,
    seriesSpecs,
    registerSeries,
    unregisterSeries,
    entranceDone: ready,
    seedOf,
    common,
  }
}
