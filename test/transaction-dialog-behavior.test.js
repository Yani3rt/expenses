import test from "node:test";
import assert from "node:assert/strict";
import {
  createInitialTransactionDetailState,
  transactionDetailReducer,
} from "../lib/transaction-detail-state.js";
import { createDialogBehaviorSession, installDialogBehavior, isBackdropDismissal } from "../lib/dialog-behavior.js";

function fakeButton(name) {
  return { name, focus() { this.owner.activeElement = this; } };
}

function dialogHarness() {
  const listeners = new Map();
  const document = {
    activeElement: null,
    body: { style: { overflow: "scroll" } },
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type);
    },
  };
  const first = fakeButton("first");
  const last = fakeButton("last");
  first.owner = last.owner = document;
  const dialog = {
    querySelector() { return first; },
    querySelectorAll() { return [first, last]; },
  };
  const dispatchKey = (key, shiftKey = false) => {
    let prevented = false;
    listeners.get("keydown")?.({ key, shiftKey, preventDefault() { prevented = true; } });
    return prevented;
  };
  return { document, dialog, first, last, dispatchKey, listeners };
}

test("dialog behavior focuses the first control and traps Tab in both directions", () => {
  const harness = dialogHarness();
  const cleanup = installDialogBehavior({ dialog: harness.dialog, document: harness.document, onClose() {} });

  assert.equal(harness.document.activeElement, harness.first);
  assert.equal(harness.document.body.style.overflow, "hidden");
  harness.document.activeElement = harness.last;
  assert.equal(harness.dispatchKey("Tab"), true);
  assert.equal(harness.document.activeElement, harness.first);
  assert.equal(harness.dispatchKey("Tab", true), true);
  assert.equal(harness.document.activeElement, harness.last);

  cleanup();
  assert.equal(harness.document.body.style.overflow, "scroll");
  assert.equal(harness.listeners.has("keydown"), false);
});

test("dialog behavior closes on Escape", () => {
  const harness = dialogHarness();
  let closes = 0;
  installDialogBehavior({ dialog: harness.dialog, document: harness.document, onClose() { closes += 1; } });
  assert.equal(harness.dispatchKey("Escape"), true);
  assert.equal(closes, 1);
});

test("dialog behavior session keeps focus stable across loading, success, error, and retry rerenders", () => {
  const harness = dialogHarness();
  let firstCloses = 0;
  let latestCloses = 0;
  const session = createDialogBehaviorSession({
    dialog: harness.dialog,
    document: harness.document,
    onClose() { firstCloses += 1; },
  });
  const userFocusedControl = { name: "retry", owner: harness.document, focus() { this.owner.activeElement = this; } };
  userFocusedControl.focus();

  for (const status of ["success", "error", "loading"]) {
    session.update({ onClose() { latestCloses += 1; }, status });
    assert.equal(harness.document.activeElement, userFocusedControl);
  }

  harness.dispatchKey("Escape");
  assert.equal(firstCloses, 0);
  assert.equal(latestCloses, 1);
  session.destroy();
});

test("transaction detail state opens immediately, retains summary through failure and retry, and restores trigger focus on close", () => {
  const transaction = { id: 7, amount: 42, date: "2026-07-01", category: "Food", paidBy: "Sam" };
  const trigger = { focused: false, focus() { this.focused = true; } };
  let state = createInitialTransactionDetailState();
  state = transactionDetailReducer(state, { type: "open", transaction, trigger });
  assert.deepEqual(state, { transaction, trigger, detail: null, status: "loading", error: "" });

  state = transactionDetailReducer(state, { type: "failure", error: "Offline" });
  assert.equal(state.transaction, transaction);
  assert.equal(state.status, "error");
  state = transactionDetailReducer(state, { type: "retry" });
  assert.equal(state.transaction, transaction);
  assert.equal(state.status, "loading");

  const closing = transactionDetailReducer(state, { type: "close" });
  closing.restoreFocus();
  assert.equal(trigger.focused, true);
  assert.equal(closing.transaction, null);
});

test("backdrop and close-button paths invoke the same close callback", () => {
  let closes = 0;
  const onClose = () => { closes += 1; };
  const backdrop = {};
  const onBackdropMouseDown = (event) => isBackdropDismissal(event) && onClose();
  onBackdropMouseDown({ target: backdrop, currentTarget: backdrop });
  onBackdropMouseDown({ target: {}, currentTarget: backdrop });
  onClose();
  assert.equal(closes, 2);
});
