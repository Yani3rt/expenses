import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sidebar = readFileSync(new URL("../components/Sidebar.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("mobile navigation uses a toggle button and backdrop instead of turning into a horizontal top nav", () => {
  assert.match(sidebar, /mobile-nav-toggle/);
  assert.match(sidebar, /mobile-backdrop/);
  assert.match(styles, /\.sidebar \{[\s\S]*position: fixed;/);
  assert.match(styles, /\.sidebar\.is-open \{ transform: translateX\(0\); \}/);
  assert.doesNotMatch(styles, /\.side-nav \{ display: flex; overflow-x: auto;/);
});

test("small-screen layout collapses grids to one column and prevents horizontal overflow regressions", () => {
  assert.match(styles, /body \{[^}]*overflow-x: hidden;/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.metrics-grid, \.content-grid, \.status-grid \{ grid-template-columns: minmax\(0, 1fr\);/);
  assert.match(styles, /@media \(max-width: 520px\)[\s\S]*\.expense-row \{[\s\S]*grid-template-columns: 44px minmax\(0, 1fr\);/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.category-table \.rank \{ grid-column: 1; grid-row: 1 \/ span 2;/);
  assert.match(styles, /@media \(max-width: 520px\)[\s\S]*\.category-table b \{ grid-column: 2 \/ -1; grid-row: 3;/);
});


test("desktop sidebar can be collapsed and restored without replacing mobile navigation", () => {
  assert.match(sidebar, /desktop-sidebar-collapse/);
  assert.match(sidebar, /desktop-sidebar-restore/);
  assert.match(sidebar, /expense-viewer-sidebar-collapsed/);
  assert.match(styles, /body\.sidebar-collapsed \.app-shell \{ grid-template-columns: 0 minmax\(0, 1fr\); \}/);
  assert.match(styles, /body\.sidebar-collapsed \.desktop-sidebar-restore \{ display: inline-flex; \}/);
  assert.match(styles, /@media \(max-width: 1080px\)[\s\S]*body\.sidebar-collapsed \.app-shell \{ grid-template-columns: minmax\(0, 1fr\); \}/);
});


test("motion layer respects reduced motion and uses transform-based animations", () => {
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@keyframes pageRise/);
  assert.match(styles, /@keyframes softPop/);
  assert.match(styles, /@keyframes fillBar/);
  assert.match(styles, /transform: translateY/);
  assert.match(styles, /transition: transform/);
});
