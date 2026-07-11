"use client";
import { CartesianCanvas } from "./cartesian-canvas"
import { CartesianRoot } from "./cartesian-root";

/** Composable dither **area** chart. Compose `<Area>`, `<Grid>`, axes, … inside. */
export function AreaChart(props) {
  return <CartesianRoot chartType="area" Canvas={CartesianCanvas} {...props} />;
}

/** Composable dither **line** chart — `<Line>` series with a glow under the line. */
export function LineChart(props) {
  return <CartesianRoot chartType="line" Canvas={CartesianCanvas} {...props} />;
}
