/** One coalesced paint per invalidation. Visibility events, never a RAF poll,
 * resume the latest state. Immediate paints intentionally have no animation tail. */
export function createDemandPainter({
  element,
  paint,
  document = globalThis.document,
  requestFrame = globalThis.requestAnimationFrame,
  cancelFrame = globalThis.cancelAnimationFrame,
  IntersectionObserver = globalThis.IntersectionObserver,
}) {
  let visible = !IntersectionObserver;
  let dirty = true;
  let frame = null;
  let generation = 0;
  let disposed = false;

  function cancel() {
    generation += 1;
    if (frame !== null) cancelFrame(frame);
    frame = null;
  }

  function schedule() {
    if (disposed || !dirty || !visible || document.hidden || frame !== null) return;
    const ticket = generation;
    frame = requestFrame(() => {
      if (disposed || ticket !== generation) return;
      frame = null;
      if (!visible || document.hidden) return;
      dirty = false;
      paint();
    });
  }

  function invalidate() {
    dirty = true;
    schedule();
  }

  function visibilityChanged() {
    // Repaint on resume even when clean: the browser may discard canvas pixels.
    dirty = true;
    if (!visible || document.hidden) cancel();
    else schedule();
  }

  const observer = IntersectionObserver ? new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visibilityChanged();
  }) : null;
  observer?.observe(element);
  document.addEventListener('visibilitychange', visibilityChanged);
  schedule();

  return {
    invalidate,
    dispose() {
      if (disposed) return;
      disposed = true;
      cancel();
      observer?.disconnect();
      document.removeEventListener('visibilitychange', visibilityChanged);
    },
  };
}
