import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCumulativeData, buildMonthlyData, buildDailyData } from '../lib/spending-chart-data.js';

test('cumulative comparison fills missing days and retains unequal month lengths', () => {
  assert.deepEqual(buildCumulativeData([{ date: '2026-06-02', totalSpend: 20 }], [{ date: '2026-05-01', totalSpend: 5 }, { date: '2026-05-03', totalSpend: 7 }]), [
    { day: '1', current: 0, previous: 5 }, { day: '2', current: 20, previous: 5 }, { day: '3', current: 20, previous: 12 },
  ]);
  assert.deepEqual(buildCumulativeData([], []), [{ day: '1', current: 0, previous: 0 }]);
});

test('monthly history keeps twelve latest rows with month labels and leaves source rows untouched', () => {
  const rows = Array.from({ length: 13 }, (_, i) => Object.freeze({ month: `2026-${String(i + 1).padStart(2, '0')}`, totalSpend: i }));
  const result = buildMonthlyData(Object.freeze(rows));
  assert.equal(result.length, 12);
  assert.deepEqual(result[0], { month: '2026-02', totalSpend: 1, label: '02' });
  assert.equal(result.at(-1).totalSpend, 12);
  assert.equal(rows[1].label, undefined);
});

test('daily range includes week endpoints without changing monthly or cumulative inputs', () => {
  const rows = Object.freeze([
    Object.freeze({ date: '2026-09-01', totalSpend: 10 }),
    Object.freeze({ date: '2026-09-02', totalSpend: 20 }),
    Object.freeze({ date: '2026-09-08', totalSpend: 30 }),
  ]);
  assert.deepEqual(buildDailyData(rows, 'week', { start: '2026-09-02', end: '2026-09-08' }), [
    { date: '2026-09-02', totalSpend: 20, day: '2' }, { date: '2026-09-08', totalSpend: 30, day: '8' },
  ]);
  assert.equal(buildDailyData(rows, 'month', {}).length, 3);
  assert.equal(rows[0].day, undefined);
});
