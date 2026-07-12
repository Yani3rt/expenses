# Sidebar Particle Accent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a subtle static particle texture to the active sidebar navigation item.

**Architecture:** Use a CSS pseudo-element on `.side-nav a.active`, with token-based radial gradients and a horizontal mask. Keep `.nav-item-main` above the decorative layer.

**Tech Stack:** CSS, Node test runner

## Global Constraints

- Add no production dependencies.
- Do not change navigation behavior or markup.
- Keep the particle field static and low contrast.
- Keep database access read-only.

---

### Task 1: Active navigation particle accent

**Files:**
- Modify: `app/globals.css`
- Test: `test/responsive-ui.test.js`

**Interfaces:**
- Consumes: Existing `.side-nav a.active` selected-state class.
- Produces: Decorative `.side-nav a.active::after` particle field.

- [ ] **Step 1: Write the failing test**

Assert the active link has isolated overflow, a radial-gradient pseudo-element with a mask, and elevated `.nav-item-main` content.

- [ ] **Step 2: Verify the test fails**

Run `pnpm test --test-name-pattern="active sidebar item uses a subtle particle accent"` and confirm the missing selector causes failure.

- [ ] **Step 3: Implement the minimal CSS**

Add positioning and isolation to the active link, add the static masked dot layer, and set the content layer above it.

- [ ] **Step 4: Verify the implementation**

Run `EXPENSE_DB_PATH=/Users/yani/Dev/expenses/expenses.db pnpm test` and `EXPENSE_DB_PATH=/Users/yani/Dev/expenses/expenses.db pnpm run build` against the read-only local fixture.

- [ ] **Step 5: Inspect the browser**

Confirm the active Dashboard item shows a restrained particle accent and inactive items remain unchanged.
