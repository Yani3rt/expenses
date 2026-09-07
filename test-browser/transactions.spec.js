import { chooseOption } from './select-helpers.js';
import { expect, test } from "@playwright/test";

function waitForPaginationLifecycle(page) {
  return new Promise((resolve) => {
    const matches = (request) => {
      const url = new URL(request.url());
      return url.pathname === "/api/transactions" && url.searchParams.get("offset") === "10";
    };
    const finish = (status) => (request) => {
      if (!matches(request)) return;
      page.off("requestfinished", onFinished);
      page.off("requestfailed", onFailed);
      resolve(status);
    };
    const onFinished = finish("finished");
    const onFailed = finish("failed");
    page.on("requestfinished", onFinished);
    page.on("requestfailed", onFailed);
  });
}

test("initial ledger, all-time reset, controls, and pagination continuation", async ({ page }) => {
  await page.goto("/transactions");
  await expect(page.getByRole("heading", { name: "Expense ledger" })).toBeVisible();
  await expect(page.locator(".dense-list .expense-row")).toHaveCount(10);

  await page.getByRole("button", { name: "All time", exact: true }).click();
  await expect(page).toHaveURL(/\/transactions\?period=all$/);
  await expect(page.getByText("24 matches", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "More filters" }).click();
  await page.getByRole("button", { name: /All categories/ }).click();
  await page.getByRole("checkbox", { name: "Technology" }).click();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/category=tecnologia/);
  await expect(page.getByText("3 matches", { exact: true })).toBeVisible();

  await chooseOption(page, page.getByRole("combobox", { name: "Month", exact: true }), "2026-06");
  await expect(page).toHaveURL(/month=2026-06/);
  await expect(page.getByText("2 matches", { exact: true })).toBeVisible();

  const search = page.getByLabel("Search transactions");
  await search.fill("tech");
  await expect(page).toHaveURL(/q=tech/);
  await expect(page.getByText("2 matches", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page).toHaveURL(/\/transactions\?period=all$/);
  await expect(search).toHaveValue("");

  await page.goto("/transactions?period=all&offset=10&limit=2");
  await expect(page.locator(".dense-list .expense-row")).toHaveCount(2);
  await expect(page.getByRole("button", { name: /Breakfast/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Flight change/ })).toBeVisible();
  await page.getByRole("button", { name: "Load more" }).click();
  await expect(page.locator(".dense-list .expense-row")).toHaveCount(4);
  await expect(page.getByRole("button", { name: /Airport transfer/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Tech expense/ })).toBeVisible();
});

test("pending search ownership composes with filters, chips, clear, and history", async ({ page }) => {
  await page.goto("/transactions?period=all");
  await page.getByRole("button", { name: "More filters" }).click();
  const search = page.getByLabel("Search transactions");
  await search.fill("tech");
  await chooseOption(page, page.getByRole("combobox", { name: "Sort", exact: true }), "highest");
  await expect(page).toHaveURL(/q=tech/);
  await expect(page).toHaveURL(/sort=highest/);
  await expect(search).toHaveValue("tech");

  await page.goto("/transactions?period=all&category=viajes");
  await page.getByRole("button", { name: "More filters" }).click();
  await search.fill("tech");
  await page.getByRole("button", { name: "Search: tech ×", exact: true }).click();
  await page.getByRole("button", { name: "Category Travel", exact: true }).click();
  await page.getByRole("checkbox", { name: "Technology" }).click();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/category=viajes/);
  await expect(page).toHaveURL(/category=tecnologia/);
  await expect(page).not.toHaveURL(/q=/);
  await expect(search).toHaveValue("");

  await search.fill("food");
  await page.getByRole("button", { name: "Clear all" }).click();
  await page.getByRole("button", { name: "Last month", exact: true }).click();
  await expect(page).toHaveURL(/period=last_month/);
  await expect(page).not.toHaveURL(/q=/);
  await expect(search).toHaveValue("");

  await page.goto("/transactions");
  await page.getByRole("button", { name: "All time", exact: true }).click();
  await expect(page).toHaveURL(/period=all/);
  await page.getByRole("button", { name: "This month", exact: true }).click();
  await expect(page).toHaveURL(/period=this_month/);
  await search.fill("pending");
  await page.goBack();
  await expect(page).toHaveURL(/period=all/);
  await expect(search).toHaveValue("");
  await page.goForward();
  await expect(page).toHaveURL(/period=this_month/);
  await expect(search).toHaveValue("");
});

test("a newer search draft survives completion of its slower prior navigation", async ({ page }) => {
  let releasePriorSearch;
  let priorSearchStarted;
  const gate = new Promise((resolve) => { releasePriorSearch = resolve; });
  const started = new Promise((resolve) => { priorSearchStarted = resolve; });

  await page.route("**/transactions?**", async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("q") === "tech" && url.searchParams.has("_rsc")) {
      priorSearchStarted();
      await gate;
    }
    await route.continue();
  });

  await page.goto("/transactions?period=all");
  const search = page.getByLabel("Search transactions");
  await search.fill("tech");
  await started;
  await search.fill("travel");
  releasePriorSearch();

  await page.waitForURL((url) => url.searchParams.get("q") === "tech");
  await expect(search).toHaveValue("travel");
  await expect(page).toHaveURL(/q=travel/);
  await expect(search).toHaveValue("travel");
});

test("an explicit month uses normalized all-time intent when its chip is removed", async ({ page }) => {
  await page.goto("/transactions?month=2026-06");

  const activeChips = page.locator(".active-filter-chips .filter-chip");
  await expect(activeChips).toHaveCount(1);
  await expect(activeChips).toContainText("2026-06");

  await activeChips.first().click();
  await expect(page).toHaveURL(/\/transactions\?period=all$/);
  await expect(page.locator(".active-filter-chips .filter-chip")).toHaveCount(0);
});

test("stale pagination cannot overwrite a committed filter", async ({ page }) => {
  let release;
  let interceptedComplete;
  const held = new Promise((resolve) => { release = resolve; });
  const intercepted = new Promise((resolve) => { interceptedComplete = resolve; });
  await page.route(/\/api\/transactions\?.*offset=10/, async (route) => {
    await held;
    try {
      await route.fulfill({
        json: {
          transactions: [{ id: 999, date: "2026-01-01", description: "STALE ROW", amount: 1, currency: "USD", category: "Food", categorySlug: "comida", paidBy: "Yani", notes: null }],
          meta: { period: "this_month", month: "all", categories: [], q: "", sort: "newest", offset: 10, limit: 10, hasMore: false, periodLabel: "This month" },
        },
      });
    } finally {
      interceptedComplete();
    }
  });

  await page.goto("/transactions");
  const lifecycle = waitForPaginationLifecycle(page);
  await page.getByRole("button", { name: "Load more" }).click();
  await expect(page.getByRole("button", { name: "Loading…" })).toBeDisabled();
  await page.getByRole("button", { name: "All time", exact: true }).click();
  await expect(page).toHaveURL(/period=all/);
  release();
  await Promise.all([intercepted, lifecycle]);
  await expect(page.getByText("STALE ROW")).toHaveCount(0);
  await expect(page.locator(".dense-list .expense-row")).toHaveCount(10);
  await expect(page.getByRole("button", { name: "Load more" })).toBeEnabled();
});

test("a stale rejected pagination request cannot surface an error after filtering", async ({ page }) => {
  let release;
  let interceptedComplete;
  const held = new Promise((resolve) => { release = resolve; });
  const intercepted = new Promise((resolve) => { interceptedComplete = resolve; });
  await page.route(/\/api\/transactions\?.*offset=10/, async (route) => {
    await held;
    try {
      await route.abort("failed");
    } finally {
      interceptedComplete();
    }
  });
  await page.goto("/transactions");
  const lifecycle = waitForPaginationLifecycle(page);
  await page.getByRole("button", { name: "Load more" }).click();
  await page.getByRole("button", { name: "All time", exact: true }).click();
  await expect(page).toHaveURL(/period=all/);
  release();
  await Promise.all([intercepted, lifecycle]);
  await expect(page.getByRole("button", { name: "Try again" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Load more" })).toBeEnabled();
});

test("pagination and dialog failures retry, and every close restores row focus", async ({ page }) => {
  let pageAttempts = 0;
  await page.route(/\/api\/transactions\?.*offset=10/, async (route) => {
    pageAttempts += 1;
    if (pageAttempts === 1) await route.fulfill({ status: 503, body: "temporary" });
    else await route.continue();
  });
  await page.goto("/transactions");
  await page.getByRole("button", { name: "Load more" }).click();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator(".dense-list .expense-row")).toHaveCount(12);

  let detailAttempts = 0;
  await page.route("**/api/transactions/24", async (route) => {
    detailAttempts += 1;
    if (detailAttempts === 1) await route.fulfill({ status: 503, body: "temporary" });
    else await route.continue();
  });
  const row = page.getByRole("button", { name: /Tech accessory/ });
  await row.click();
  const dialog = page.getByRole("dialog", { name: /Technology in July 2026/ });
  await expect(dialog.getByRole("alert")).toBeVisible();
  await dialog.getByRole("button", { name: "Try again" }).click();
  await expect(dialog.getByText("Category total")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(row).toBeFocused();

  await row.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close transaction details" }).click();
  await expect(row).toBeFocused();

  await row.click();
  await expect(dialog).toBeVisible();
  await page.locator(".transaction-dialog-backdrop").click({ position: { x: 4, y: 4 } });
  await expect(row).toBeFocused();
});
