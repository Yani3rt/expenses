"use client";
import { useMemo } from "react";
import { useChart } from "./chart-context";
import { backingSize, bloomLayerStyle } from "./dither-paint";
import { buildCartesianTargets, paintCartesian } from "./canvas-paint.js";
import { useDemandCanvas } from "./use-demand-canvas.js";

/** Dithered final-state paint on demand; visibility is managed by the shared
 * scheduler. Pointer position never rebuilds data-derived paint targets. */
export function CartesianCanvas() {
  const ctx = useChart();
  const { width, height } = ctx.plot;
  const { cols, rows } = backingSize(width, height);
  const { ready, bands, configKeys, y, seriesSpecs, chartType } = ctx;
  const targets = useMemo(() => buildCartesianTargets({
    ready, bands, configKeys, y, height, rows, cols, seriesSpecs, chartType,
  }), [ready, bands, configKeys, y, height, rows, cols, seriesSpecs, chartType]);
  const { canvasRef, bloomRef } = useDemandCanvas({
    state: ctx, targets, paint: paintCartesian, cols, rows, width,
  });

  const bloomActive = !ctx.bloomOnHover || ctx.isMouseInChart || ctx.hovered;
  const bloom = bloomLayerStyle(ctx.bloom, bloomActive);
  const pos = { left: ctx.margins.left, top: ctx.margins.top, width, height };

  return (
    <>
      <canvas ref={canvasRef} className="pointer-events-none absolute"
        style={{ ...pos, imageRendering: "pixelated" }} />
      <canvas ref={bloomRef} className="pointer-events-none absolute"
        style={{ ...pos, ...(bloom ?? { opacity: 0 }) }} />
    </>
  );
}
