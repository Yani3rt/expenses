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
});
