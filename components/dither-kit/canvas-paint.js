import { paintColumn, resample } from './dither-paint.js';
import { rgb } from './palette.js';

// Geometry only: callers memoize these independently from pointer/selection.
export function buildCartesianTargets({ ready, bands, configKeys, y, height, rows, cols, seriesSpecs, chartType }) {
  const out = {};
  if (!ready) return out;
  const glow = Math.max(6, Math.round(rows * 0.16));
  const defaultKind = chartType === 'line' ? 'line' : 'area';
  for (const key of configKeys) {
    const band = bands[key];
    if (!band?.length) continue;
    const line = (seriesSpecs[key]?.kind ?? defaultKind) === 'line';
    const top = band.map((b) => (y(b[1]) / (height || 1)) * (rows - 1));
    const floor = band.map((b, i) => line
      ? Math.min(rows - 1, top[i] + glow)
      : (y(b[0]) / (height || 1)) * (rows - 1));
    out[key] = { top: resample(top, cols), floor: resample(floor, cols) };
  }
  return out;
}

export function buildBarTargets({ ready, bands, configKeys, y, height, rows }) {
  const out = {};
  if (!ready) return out;
  for (const key of configKeys) {
    const band = bands[key];
    if (!band?.length) continue;
    out[key] = {
      top: band.map((b) => (y(b[1]) / (height || 1)) * (rows - 1)),
      base: band.map((b) => (y(b[0]) / (height || 1)) * (rows - 1)),
    };
  }
  return out;
}

function syncBloom({ bloom, canvas, cols, rows, state }) {
  if (!bloom) return;
  bloom.clearRect(0, 0, cols, rows);
  if (state.ready && state.bloom !== 'off' && (!state.bloomOnHover || state.isMouseInChart || state.hovered)) {
    bloom.drawImage(canvas, 0, 0);
  }
}

/** Paint final geometry in one pass; no reveal, easing, or sparkle timer. */
export function paintCartesian(frame) {
  const { c, cols, rows, state: s, targets } = frame;
  c.clearRect(0, 0, cols, rows);
  if (s.ready) {
    const stacked = s.stackType === 'stacked' || s.stackType === 'percent';
    const emphasis = s.selectedDataKey ?? s.focusDataKey;
    const intensity = s.isMouseInChart || s.hovered ? 1 : 0;
    s.configKeys.forEach((key, si) => {
      const target = targets[key];
      if (!target) return;
      const seed = s.seedOf(key);
      const isLine = (s.seriesSpecs[key]?.kind ?? (s.chartType === 'line' ? 'line' : 'area')) === 'line';
      for (let x = 0; x < cols; x++) {
        paintColumn(c, x, target.top[x] ?? 0, target.floor[x] ?? 0, seed, {
          variant: s.seriesSpecs[key]?.variant ?? 'gradient',
          intensity,
          dim: emphasis !== null && emphasis !== key ? 0.3 : 1,
          stacked: stacked && !isLine,
          sparse: stacked ? 0 : si * 0.14,
        });
      }
    });
    const marker = s.hoverIndex ?? s.markerIndex;
    const mx = marker != null && marker >= 0 && marker < s.dataLength
      ? s.dataLength === 1
        ? Math.round((cols - 1) / 2)
        : Math.round((marker / (s.dataLength - 1)) * (cols - 1))
      : -1;
    if (mx >= 0) {
      for (const key of s.configKeys) {
        const target = targets[key];
        if (!target) continue;
        const seed = s.seedOf(key);
        const my = Math.round(target.top[mx] ?? 0);
        c.fillStyle = rgb(seed.fill, 1, 0.55);
        for (let y = my; y < rows; y++) c.fillRect(mx, y, 1, 1);
        c.fillStyle = rgb(seed.fill);
        c.fillRect(mx - 1, my - 1, 3, 3);
      }
    }
  }
  syncBloom(frame);
}

export function paintBars(frame) {
  const { c, cols, rows, width, state: s, targets } = frame;
  c.clearRect(0, 0, cols, rows);
  if (s.ready) {
    const fx = cols / Math.max(width, 1);
    const stacked = s.stackType === 'stacked' || s.stackType === 'percent';
    const emphasis = s.selectedDataKey ?? s.focusDataKey;
    const intensity = s.isMouseInChart || s.hovered ? 1 : 0;
    s.configKeys.forEach((key, si) => {
      const target = targets[key];
      if (!target) return;
      const seed = s.seedOf(key);
      const selDim = emphasis !== null && emphasis !== key ? 0.3 : 1;
      for (let i = 0; i < s.dataLength; i++) {
        const active = s.hoverIndex === i;
        const hoverDim = s.hoverIndex != null && !active && s.isMouseInChart ? 0.5 : 1;
        const slot = s.barSlot(i, si, s.configKeys.length);
        const c0 = Math.round(slot.x * fx);
        const c1 = Math.round((slot.x + slot.width) * fx);
        for (let x = c0; x < c1; x++) {
          paintColumn(c, x, target.top[i] ?? rows - 1, target.base[i] ?? rows - 1, seed, {
            variant: s.seriesSpecs[key]?.variant ?? 'gradient',
            intensity: intensity + (active ? 0.4 : 0),
            dim: selDim * hoverDim,
            stacked,
          });
        }
      }
    });
  }
  syncBloom(frame);
}
