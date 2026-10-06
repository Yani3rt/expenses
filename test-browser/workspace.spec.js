import { expect, test } from '@playwright/test';

const july = '/?range=1m&end=2026-07-31';

test('one date range controls the overview and ledger, with navigable history', async ({ page }) => {
  await page.goto(july);
  await expect(page.getByRole('heading', { name: 'Spending', exact: true })).toBeVisible();
  await expect(page.getByTestId('workspace-total')).toHaveText('$597.84');
  await page.getByRole('button', { name: '1W', exact: true }).click();
  await expect(page).toHaveURL(/range=1w/);
  await expect(page.getByTestId('workspace-total')).toHaveText('$108.09');
  await page.getByRole('button', { name: 'Previous period' }).click();
  await expect(page).toHaveURL(/end=2026-07-24/);
  await expect(page.getByTestId('workspace-total')).toHaveText('$56.30');
  await page.goBack();
  await expect(page.getByTestId('workspace-total')).toHaveText('$108.09');
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.getByTestId('workspace-total')).toHaveText('$2,296.59');
});

test('category and search filter the ledger without changing period totals', async ({ page }) => {
  await page.goto(july);
  await page.getByRole('button', { name: /Filter by Technology/ }).click();
  await expect(page).toHaveURL(/category=tecnologia/);
  await expect(page.getByTestId('workspace-transaction')).toHaveCount(1);
  await expect(page.getByTestId('workspace-transaction')).toContainText('Tech accessory');
  await expect(page.getByTestId('workspace-total')).toHaveText('$597.84');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search transactions' }).fill('groceries');
  await page.getByRole('searchbox', { name: 'Search transactions' }).press('Enter');
  await expect(page).toHaveURL(/q=groceries/);
  await expect(page.getByTestId('workspace-transaction')).toHaveCount(2);
  await expect(page.getByTestId('workspace-transaction').first()).toContainText('Groceries');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.getByRole('searchbox', { name: 'Search transactions' })).toHaveValue('');
});

test('pagination keeps every record reachable and detail preserves focus', async ({ page }) => {
  await page.goto('/?range=all');
  await expect(page.getByTestId('workspace-transaction')).toHaveCount(20);
  await page.getByRole('button', { name: 'Load more', exact: true }).click();
  await expect(page.getByTestId('workspace-transaction')).toHaveCount(24);
  const target = page.getByTestId('workspace-transaction').filter({ hasText: 'Tech accessory' });
  await target.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Tech accessory');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(target).toBeFocused();
});

test('empty recent window can jump to the latest recorded activity', async ({ page }) => {
  await page.goto('/?range=1w&end=2026-09-06');
  await expect(page.getByTestId('workspace-total')).toHaveText('$0.00');
  await page.getByRole('button', { name: 'Latest activity', exact: true }).click();
  await expect(page).toHaveURL(/end=2026-07-31/);
  await expect(page.getByTestId('workspace-total')).toHaveText('$108.09');
});

test('failed continuation can retry without losing already rendered transactions', async ({ page }) => {
  let fail = true;
  await page.route('**/api/workspace?**', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('offset') === '20' && fail) {
      fail = false;
      await route.fulfill({ status: 503, json: { error: 'Temporary test failure' } });
    } else {
      await route.continue();
    }
  });
  await page.goto('/?range=all');
  await page.getByRole('button', { name: 'Load more', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'More transactions' })).toBeVisible();
  await expect(page.getByTestId('workspace-transaction')).toHaveCount(20);
  await page.getByRole('button', { name: /Try again|Retry|Load more/ }).click();
  await expect(page.getByTestId('workspace-transaction')).toHaveCount(24);
});

test('obsolete continuation cannot append rows after the range changes', async ({ page }) => {
  let release;
  let started;
  let finished;
  const gate = new Promise(resolve => { release = resolve; });
  const held = new Promise(resolve => { started = resolve; });
  const handled = new Promise(resolve => { finished = resolve; });
  await page.route('**/api/workspace?**', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('offset') !== '20') return route.continue();
    started();
    await gate;
    try {
      await route.fulfill({ json: { transactions: [{ id: 99999, date: '2026-07-31', description: 'OBSOLETE ROW', amount: 1, currency: 'USD', category: 'Food', categorySlug: 'comida', paidBy: 'Yani' }], meta: { offset: 20, limit: 20, hasMore: false } } });
    } finally { finished(); }
  });
  await page.goto('/?range=all&end=2026-07-31');
  const lifecycle = new Promise(resolve => {
    const match = request => new URL(request.url()).pathname === '/api/workspace' && new URL(request.url()).searchParams.get('offset') === '20';
    const complete = request => {
      if (!match(request)) return;
      page.off('requestfinished', complete);
      page.off('requestfailed', complete);
      resolve();
    };
    page.on('requestfinished', complete);
    page.on('requestfailed', complete);
  });
  await page.getByRole('button', { name: 'Load more', exact: true }).click();
  await held;
  await page.getByRole('button', { name: '1W', exact: true }).click();
  await expect(page.getByTestId('workspace-total')).toHaveText('$108.09');
  release();
  await handled;
  await lifecycle;
  await expect(page.getByText('OBSOLETE ROW')).toHaveCount(0);
  await expect(page.getByTestId('workspace-transaction')).toHaveCount(3);
});

test('a slow submitted search cannot replace a newer unsubmitted draft', async ({ page }) => {
  let release;
  let start;
  const gate = new Promise(resolve => { release = resolve; });
  const started = new Promise(resolve => { start = resolve; });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/' && url.searchParams.get('q') === 'tech' && url.searchParams.has('_rsc')) {
      start();
      await gate;
    }
    await route.continue();
  });
  await page.goto('/?range=all');
  const search = page.getByRole('searchbox', { name: 'Search transactions' });
  await search.fill('tech');
  await search.press('Enter');
  await started;
  await search.fill('travel');
  release();
  await expect(page).toHaveURL(/q=tech/);
  await expect(search).toHaveValue('travel');
  await search.press('Enter');
  await expect(page).toHaveURL(/q=travel/);
});

test('returning to the current range supersedes a delayed navigation and keeps pagination usable', async ({ page }) => {
  let release;
  let start;
  let finish;
  const gate = new Promise(resolve => { release = resolve; });
  const started = new Promise(resolve => { start = resolve; });
  const handled = new Promise(resolve => { finish = resolve; });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/' && url.searchParams.get('range') === '1w' && url.searchParams.has('_rsc')) {
      start();
      await gate;
      try { await route.continue(); } finally { finish(); }
    } else { await route.continue(); }
  });
  await page.goto('/?range=all&end=2026-07-31&currency=USD');
  await page.getByRole('button', { name: '1W', exact: true }).click();
  await started;
  await page.getByRole('button', { name: 'All', exact: true }).click();
  release();
  await handled;
  await page.getByRole('button', { name: 'Load more', exact: true }).click();
  await expect(page.getByTestId('workspace-transaction')).toHaveCount(24);
  await expect(page).toHaveURL(/range=all/);
});

test('full details preserve amount, date, payer, notes, and allocations', async ({ page }) => {
  await page.goto('/?range=all');
  await page.getByRole('button', { name: 'Load more', exact: true }).click();
  const rent = page.getByTestId('workspace-transaction').filter({ hasText: 'May rent' });
  await rent.click();
  let selected = page.getByRole('region', { name: 'May rent', exact: true });
  await expect(selected).toContainText('$900.00');
  await expect(selected).toContainText('May 1');
  await expect(selected).toContainText('Paid by Yani');
  const allocations = selected.locator('.selected-allocations > div');
  await expect(allocations).toHaveCount(2);
  await expect(allocations.filter({ hasText: 'Alex' })).toContainText('50%');
  await expect(allocations.filter({ hasText: 'Alex' })).toContainText('$450.00');
  await expect(allocations.filter({ hasText: 'Yani' })).toContainText('$450.00');
  await expect(allocations.filter({ hasText: 'Yani' })).toContainText('50%');
  await page.keyboard.press('Escape');
  await page.getByTestId('workspace-transaction').filter({ hasText: 'Dinner' }).filter({ hasText: 'Jun 18' }).click();
  selected = page.getByRole('region', { name: 'Dinner', exact: true });
  await expect(selected).toContainText('Birthday meal');
  await expect(selected).toContainText('Paid by Alex');
  await expect(selected).toContainText('$54.60');
});

test("Ledger replays its anchor jump without resetting the selected period", async ({ page }) => {
  await page.goto("/?range=1m&end=2026-07-31&currency=USD#transactions");
  const ledger = page.getByRole("link", { name: "Ledger", exact: true });
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await ledger.click();
    await expect.poll(() => page.locator("#transactions").evaluate(el => el.getBoundingClientRect().top)).toBeLessThan(150);
    await expect(page).toHaveURL(/range=1m&end=2026-07-31&currency=USD#transactions$/);
  }
});

test("Spending returns to the overview without resetting the range or filters", async ({ page }) => {
  await page.goto("/?range=3m&end=2026-07-31&currency=USD&q=rent&sort=highest");
  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  for (let i = 0; i < 2; i++) {
    await nav.getByRole("link", { name: "Ledger", exact: true }).click();
    await nav.getByRole("link", { name: "Spending", exact: true }).click();
    await expect(page).toHaveURL(/range=3m&end=2026-07-31&currency=USD&q=rent&sort=highest/);
    await expect(page.getByRole("button", { name: "Period end date", exact: true })).toContainText("Jul 31, 2026");
    await expect(page.getByRole("button", { name: "3M", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(100);
  }
});
