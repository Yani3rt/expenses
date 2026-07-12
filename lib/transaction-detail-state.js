export function createInitialTransactionDetailState() {
  return { transaction: null, trigger: null, detail: null, status: "idle", error: "" };
}

export function transactionDetailReducer(state, action) {
  switch (action.type) {
    case "open":
      return { transaction: action.transaction, trigger: action.trigger, detail: null, status: "loading", error: "" };
    case "retry":
      return { ...state, status: "loading", error: "" };
    case "success":
      return { ...state, detail: action.detail, status: "success", error: "" };
    case "failure":
      return { ...state, status: "error", error: action.error };
    case "close": {
      const trigger = state.trigger;
      return { ...createInitialTransactionDetailState(), restoreFocus: () => trigger?.focus() };
    }
    default:
      return state;
  }
}
