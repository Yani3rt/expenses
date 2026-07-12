# Monthly Trend Dither Texture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dither-kit-inspired ordered-dot texture to every blue fill in the Monthly trend card.

**Architecture:** Preserve the existing DOM and dynamic inline heights. Use a CSS pseudo-element inside each fill for the pattern, then apply a vertical mask to make its density fade toward the top.

**Tech Stack:** Next.js, React, CSS, Node test runner

## Global Constraints

- Add no production dependencies.
- Keep the external expense database strictly read-only.
- Apply the treatment to all blue monthly fills.

---

### Task 1: Monthly fill texture

**Files:**
- Modify: `app/globals.css:661-662`
- Test: `test/dashboard-ui.test.js`

**Interfaces:**
- Consumes: Existing `.month-track > div` dynamic-height fill element.
- Produces: A decorative `.month-track > div::after` dither texture.

- [ ] **Step 1: Write the failing test**

Add a test that reads `app/globals.css` and requires a `.month-track > div::after` rule containing an ordered radial dot pattern and a vertical mask.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `pnpm test --test-name-pattern="monthly trend fills use dither texture"`

Expected: FAIL because the pseudo-element selector is absent.

- [ ] **Step 3: Write the minimal CSS implementation**

Make the fill positioned and isolated, then add an absolute decorative pseudo-element with `radial-gradient`, pixel-sized repetition, and a bottom-dense `mask-image` fade.

- [ ] **Step 4: Run full verification**

Run: `pnpm test && pnpm run build`

Expected: All tests pass and the Next.js production build exits successfully.

- [ ] **Step 5: Inspect the rendered dashboard**

Open `http://localhost:8788/` and confirm all non-zero Monthly trend fills show the texture without changing bar geometry or labels.
