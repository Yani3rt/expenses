import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sidebar = readFileSync(new URL("../components/Sidebar.js", import.meta.url), "utf8");
const mobileBackToTop = readFileSync(new URL("../components/MobileBackToTop.js", import.meta.url), "utf8");
const mobileViewportAnimator = readFileSync(new URL("../components/MobileViewportAnimator.js", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.js", import.meta.url), "utf8");
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
  assert.match(styles, /@media \(max-width: 520px\)[\s\S]*\.expense-row \{[\s\S]*grid-template-columns: 44px minmax\(0, 1fr\) auto;/);
  assert.match(styles, /@media \(max-width: 520px\)[\s\S]*\.expense-row b \{[\s\S]*grid-column: 3;[\s\S]*justify-self: end;/);
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


test("functional motion respects reduced motion", () => {
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@keyframes titleSwapIn/);
  assert.match(styles, /@keyframes rowEnter/);
  assert.match(styles, /@keyframes loadingPulse/);
  assert.match(styles, /transform: translateY/);
  assert.match(styles, /transition: transform/);
});


test("mobile viewport animator pauses offscreen card animations until they enter view", () => {
  assert.match(layout, /<MobileViewportAnimator \/>/);
  assert.match(mobileViewportAnimator, /IntersectionObserver/);
  assert.match(mobileViewportAnimator, /motion-pending/);
  assert.match(mobileViewportAnimator, /\(max-width: 760px\)/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*animation-play-state: paused !important;/);
  assert.match(styles, /\.motion-reveal-target\.motion-pending \{[\s\S]*will-change: transform, opacity;/);
});


test("mobile viewport animator re-arms when the Next.js route changes", () => {
  assert.match(mobileViewportAnimator, /usePathname/);
  assert.match(mobileViewportAnimator, /routeKey/);
  assert.match(mobileViewportAnimator, /requestAnimationFrame/);
  assert.match(mobileViewportAnimator, /\}, \[routeKey\]\);/);
});

test("mobile back-to-top button only appears after the top leaves view", () => {
  assert.match(layout, /data-top-sentinel/);
  assert.match(layout, /<MobileBackToTop \/>/);
  assert.match(mobileBackToTop, /IntersectionObserver/);
  assert.match(mobileBackToTop, /data-top-sentinel/);
  assert.match(mobileBackToTop, /window\.scrollTo\(\{ top: 0, behavior:/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.mobile-back-to-top \{/);
  assert.match(styles, /\.mobile-back-to-top\.is-visible \{/);
});
