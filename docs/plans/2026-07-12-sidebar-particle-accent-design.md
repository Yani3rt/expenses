# Sidebar Particle Accent Design

## Goal

Add a quiet dithered particle field to the active sidebar navigation item.

## Design

The active link keeps its existing dark surface, shadow, spacing, and interaction. A decorative pseudo-element adds two offset dot layers at low opacity, masked so the texture gathers toward the right side and softly disappears into the label area. Navigation content remains above the texture and the layer ignores pointer events.

The effect is static, appears only on the active item, uses existing surface tokens, and requires no DOM or dependency changes.

## Verification

Add a CSS regression assertion, run it red then green, run the complete test suite and production build with the read-only fixture database, and inspect the active item in the browser.
