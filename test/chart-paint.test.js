import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCartesianTargets, buildBarTargets, paintCartesian, paintBars } from '../components/dither-kit/canvas-paint.js';

const geometry = {
  ready: true, bands: { spend: [[0, 0], [0, 10]] }, configKeys: ['spend'],
  y: (value) => 100 - value * 10, height: 100, rows: 11, cols: 3,
  seriesSpecs: {}, chartType: 'area',
};

test('area targets resample numeric bands without pointer or selection state', () => {
  assert.deepEqual(buildCartesianTargets(geometry), { spend: { top: [10, 5, 0], floor: [10, 10, 10] } });
  assert.deepEqual(buildCartesianTargets({ ...geometry, hoverIndex: 1, cursorX: 333, selectedDataKey: 'spend' }), buildCartesianTargets(geometry));
});

test('line targets form a bounded glow band while bar targets retain categorical bases', () => {
  assert.deepEqual(buildCartesianTargets({ ...geometry, chartType: 'line' }), { spend: { top: [10, 5, 0], floor: [10, 8, 6] } });
  assert.deepEqual(buildBarTargets(geometry), { spend: { top: [10, 0], base: [10, 10] } });
  assert.deepEqual(buildBarTargets({ ...geometry, ready: false }), {});
  assert.deepEqual(buildCartesianTargets({ ...geometry, ready: false }), {});
});

function context(log, name) {
  return {
    clearRect: (...args) => log.push([name, 'clear', ...args]),
    fillRect(...args) { log.push([name, 'fill', ...args, this.fillStyle]); },
    drawImage: (...args) => log.push([name, 'copy', ...args]),
  };
}
function fixture() {
  const log = [];
  const c = context(log, 'crisp');
  const bloom = context(log, 'bloom');
  const canvas = {};
  return { log, c, bloom, canvas, cols: 3, rows: 11, width: 3, state: {
    ready: true, configKeys: ['spend'], dataLength: 2, stackType: 'default',
    seriesSpecs: {}, seedOf: () => ({ fill: [10, 20, 30] }),
    selectedDataKey: null, focusDataKey: null, isMouseInChart: false,
    hovered: false, hoverIndex: null, markerIndex: null, bloom: 'aura', bloomOnHover: false,
    barSlot: (i) => ({ x: i, width: 1 }),
  } };
}

for (const [name, paint, build] of [['cartesian', paintCartesian, buildCartesianTargets], ['bar', paintBars, buildBarTargets]]) {
  test(`${name} paints the current crisp pixels before copying bloom, clearing disabled and hover-ended bloom`, () => {
    const f = fixture();
    f.targets = build(geometry);
    paint(f);
    assert.ok(f.log.some((entry) => entry[0] === 'crisp' && entry[1] === 'fill'));
    assert.deepEqual(f.log.at(-2), ['bloom', 'clear', 0, 0, 3, 11]);
    assert.deepEqual(f.log.at(-1), ['bloom', 'copy', f.canvas, 0, 0]);
    for (const patch of [{ bloom: 'off' }, { bloom: 'aura', bloomOnHover: true, isMouseInChart: false }]) {
      f.log.length = 0;
      Object.assign(f.state, patch);
      paint(f);
      assert.deepEqual(f.log.at(-1), ['bloom', 'clear', 0, 0, 3, 11]);
      assert.ok(!f.log.some((entry) => entry[0] === 'bloom' && entry[1] === 'copy'));
    }
  });

  test(`${name} clears the old crisp and bloom image when data is not ready`, () => {
    const f = fixture();
    f.state.ready = false;
    paint(f);
    assert.deepEqual(f.log, [['crisp', 'clear', 0, 0, 3, 11], ['bloom', 'clear', 0, 0, 3, 11]]);
  });
}

test('cartesian retains a pinned marker without any sparkle animation', () => {
  const f = fixture();
  f.targets = buildCartesianTargets(geometry);
  f.state.markerIndex = 1;
  paintCartesian(f);
  assert.ok(f.log.some((entry) => entry[0] === 'crisp' && entry[1] === 'fill' && entry[2] === 1 && entry[3] === -1 && entry[4] === 3 && entry[5] === 3));
  f.log.length = 0;
  f.state.hoverIndex = 0;
  paintCartesian(f);
  assert.ok(f.log.some((entry) => entry[0] === 'crisp' && entry[1] === 'fill' && entry[2] === -1 && entry[3] === 9 && entry[4] === 3 && entry[5] === 3), 'hover wins over controlled marker');
});

test('single-point cartesian markers align with the centered categorical scale', () => {
  const f = fixture();
  f.cols = 5;
  f.state.dataLength = 1;
  f.state.markerIndex = 0;
  f.targets = { spend: { top: [4, 4, 4, 4, 4], floor: [10, 10, 10, 10, 10] } };
  paintCartesian(f);
  assert.ok(f.log.some((entry) => entry[0] === 'crisp' && entry[1] === 'fill' && entry[2] === 1 && entry[3] === 3 && entry[4] === 3 && entry[5] === 3));
});
