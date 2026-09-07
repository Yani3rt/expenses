import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { normalizeTheme, themeInitScript } from '../lib/theme.js';

test('Momentum is default unless Classic is explicitly saved', () => {
  for (const value of [null, undefined, '', 'unknown', 'momentum']) assert.equal(normalizeTheme(value), 'momentum');
  assert.equal(normalizeTheme('classic'), 'classic');
});

test('pre-paint initialization handles missing, valid, invalid, and blocked storage', () => {
  for (const value of [null, 'classic', 'momentum', '<script>']) {
    const document = { documentElement: { dataset: {} } };
    runInNewContext(themeInitScript, { document, localStorage: { getItem: () => value } });
    assert.equal(document.documentElement.dataset.theme, normalizeTheme(value));
  }
  const document = { documentElement: { dataset: {} } };
  runInNewContext(themeInitScript, { document, localStorage: { getItem: () => { throw Error(); } } });
  assert.equal(document.documentElement.dataset.theme, 'momentum');
});
