import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemandPainter } from '../components/dither-kit/demand-painter.js';

function harness({ hidden = false, observer = true } = {}) {
  let nextId = 0;
  const frames = new Map();
  const listeners = new Map();
  let onIntersection;
  let disconnected = false;
  const document = {
    hidden,
    addEventListener: (event, callback) => listeners.set(event, callback),
    removeEventListener: (event) => listeners.delete(event),
  };
  const seen = [];
  let state = { data: 1, hover: null, selection: null, reducedMotion: false };
  const painter = createDemandPainter({
    element: {},
    paint: () => seen.push({ ...state }),
    document,
    requestFrame: (callback) => { frames.set(++nextId, callback); return nextId; },
    cancelFrame: (id) => frames.delete(id),
    IntersectionObserver: observer ? class {
      constructor(callback) { onIntersection = callback; }
      observe() {}
      disconnect() { disconnected = true; }
    } : undefined,
  });
  return {
    painter, frames, seen, listeners,
    update: (patch) => { state = { ...state, ...patch }; painter.invalidate(); },
    intersect: (visible) => onIntersection?.([{ isIntersecting: visible }]),
    hide: (hidden) => { document.hidden = hidden; listeners.get('visibilitychange')?.(); },
    flush: () => { const work = [...frames.values()]; frames.clear(); work.forEach((f) => f(100)); },
    get disconnected() { return disconnected; },
  };
}

test('coalesces dirty renders into one frame, then leaves no idle animation chain', () => {
  const h = harness();
  assert.equal(h.frames.size, 0, 'wait for first intersection instead of painting offscreen');
  h.intersect(true);
  h.painter.invalidate();
  h.painter.invalidate();
  assert.equal(h.frames.size, 1);
  h.flush();
  assert.equal(h.seen.length, 1);
  assert.equal(h.frames.size, 0);
  h.painter.dispose();
});

test('data, hover, selection, and geometry invalidations repaint current state once', () => {
  const h = harness();
  h.intersect(true); h.flush();
  for (const patch of [{ data: 2 }, { hover: 4 }, { selection: 'current' }, { width: 400 }]) {
    h.update(patch); h.flush();
    assert.deepEqual(Object.fromEntries(Object.keys(patch).map((k) => [k, h.seen.at(-1)[k]])), patch);
    assert.equal(h.frames.size, 0);
  }
  assert.equal(h.seen.length, 5);
  h.painter.dispose();
});

test('offscreen cancels work and reentry paints the newest data and selection', () => {
  const h = harness();
  h.intersect(true);
  const stale = [...h.frames.values()][0];
  h.intersect(false);
  assert.equal(h.frames.size, 0);
  h.update({ data: 7, selection: 'previous' });
  stale(100);
  assert.equal(h.seen.length, 0);
  h.intersect(true); h.flush();
  assert.equal(h.seen.at(-1).data, 7);
  assert.equal(h.seen.at(-1).selection, 'previous');
  assert.equal(h.frames.size, 0);
  h.painter.dispose();
});

test('document hiding cancels work; visibility and intersection must both allow painting', () => {
  const h = harness({ hidden: true });
  h.intersect(true);
  assert.equal(h.frames.size, 0);
  h.hide(false);
  assert.equal(h.frames.size, 1);
  h.hide(true);
  assert.equal(h.frames.size, 0);
  h.update({ data: 9 });
  h.intersect(false); h.hide(false);
  assert.equal(h.frames.size, 0);
  h.intersect(true); h.flush();
  assert.equal(h.seen.at(-1).data, 9);
  h.hide(true); h.hide(false); h.flush();
  assert.equal(h.seen.length, 2, 'resume repaints even when clean before hiding');
  h.painter.dispose();
});

test('immediate rendering stays single-frame with reduced motion and changing animation options', () => {
  const h = harness();
  h.update({ reducedMotion: true, animate: true, animationDuration: 900, revision: 1 });
  h.intersect(true); h.flush();
  h.update({ animate: false, animationDuration: 0, revision: 2 }); h.flush();
  assert.equal(h.seen.length, 2);
  assert.equal(h.frames.size, 0);
  assert.equal(h.seen.at(-1).revision, 2);
  h.painter.dispose();
});

test('cleanup cancels callbacks and removes all observers/listeners', () => {
  const h = harness();
  h.intersect(true);
  const stale = [...h.frames.values()][0];
  h.painter.dispose();
  h.painter.dispose();
  h.painter.invalidate();
  stale(100);
  h.intersect(true);
  assert.equal(h.frames.size, 0);
  assert.equal(h.seen.length, 0);
  assert.equal(h.listeners.size, 0);
  assert.equal(h.disconnected, true);
});

test('missing IntersectionObserver falls back to document visibility without polling', () => {
  const h = harness({ observer: false });
  h.flush();
  assert.equal(h.seen.length, 1);
  assert.equal(h.frames.size, 0);
  h.painter.dispose();
});
