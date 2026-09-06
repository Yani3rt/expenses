import { useEffect, useLayoutEffect, useRef } from 'react';
import { createDemandPainter } from './demand-painter.js';

/** React adapter: store committed state, invalidate only canvas inputs (not
 * cursorX/tooltip positioning), and tear down observers when geometry changes. */
export function useDemandCanvas({ state, targets, paint, cols, rows, width }) {
  const canvasRef = useRef(null);
  const bloomRef = useRef(null);
  const latest = useRef({ state, targets });
  const scheduler = useRef(null);
  useLayoutEffect(() => { latest.current = { state, targets }; });

  useEffect(() => {
    const canvas = canvasRef.current;
    const c = canvas?.getContext('2d');
    if (!canvas || !c) return;
    canvas.width = cols;
    canvas.height = rows;
    const bloomCanvas = bloomRef.current;
    const bloom = bloomCanvas?.getContext('2d');
    if (bloomCanvas) {
      bloomCanvas.width = cols;
      bloomCanvas.height = rows;
    }
    const painter = createDemandPainter({
      element: canvas,
      paint() {
        const current = latest.current;
        paint({ canvas, c, bloom, cols, rows, width, ...current });
      },
    });
    scheduler.current = painter;
    return () => {
      painter.dispose();
      scheduler.current = null;
    };
  }, [cols, rows, width, paint]);

  useEffect(() => {
    scheduler.current?.invalidate();
  }, [targets, state.ready, state.config, state.seriesSpecs, state.stackType,
    state.selectedDataKey, state.focusDataKey, state.isMouseInChart,
    state.hovered, state.hoverIndex, state.markerIndex, state.bloom,
    state.bloomOnHover, state.barSlot]);

  return { canvasRef, bloomRef };
}
