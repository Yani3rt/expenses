import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const design = readFileSync(new URL("../DESIGN.md", import.meta.url), "utf8");

test("visual system uses restrained surfaces instead of ghost cards", () => {
  assert.match(styles, /--shadow: 0 4px 12px rgba\(19, 27, 46, 0\.08\)/);
  assert.match(styles, /\.card \{[^}]*border-radius: 16px;[^}]*box-shadow: none;/);
  assert.doesNotMatch(styles, /\.card:hover \{/);
  assert.match(design, /household cockpit/i);
  assert.match(design, /14px|16px/);
  assert.doesNotMatch(design, /Glassmorphism/);
});

test("visual system removes universal and looping decorative motion", () => {
  assert.doesNotMatch(styles, /\.page-header \{ animation:/);
  assert.doesNotMatch(styles, /\.metrics-grid > \.metric \{ animation:/);
  assert.doesNotMatch(styles, /\.content-grid > \.card \{ animation:/);
  assert.doesNotMatch(styles, /animation: donutHaloBreathe/);
  assert.doesNotMatch(styles, /animation: trendGlowDrift/);
  assert.doesNotMatch(styles, /transition:[^;]*stroke-width/);
});

test("mobile keeps route orientation and the change summary has a quiet layout", () => {
  assert.doesNotMatch(styles, /\.spending-page-header \.spending-mobile-hide \{ display: none; \}/);
  assert.doesNotMatch(styles, /\.transactions-page-header \.transactions-mobile-hide \{ display: none; \}/);
  assert.match(styles, /\.change-summary \{[^}]*border:/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.change-summary \{[^}]*grid-template-columns: minmax\(0, 1fr\);/);
});
