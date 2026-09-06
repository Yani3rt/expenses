import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { useExpenseFixture } from '../test-support/expense-fixture.js';
import { getTransactionDetailData } from '../lib/queries.js';

useExpenseFixture();

test('full detail keeps notes, payer and selected transaction allocations reachable', () => {
  const detail = getTransactionDetailData({ id: 1 });
  assert.equal(detail.transaction.paidBy, 'Yani');
  assert.deepEqual(detail.transaction.allocations, [
    { name: 'Alex', slug: 'alex', percentage: 50, amount: 450 },
    { name: 'Yani', slug: 'yani', percentage: 50, amount: 450 },
  ]);
  assert.equal(getTransactionDetailData({ id: 9 }).transaction.notes, 'Birthday meal');
});

test('category context never labels a mixed currency sum as selected currency', () => {
  const fixture = new DatabaseSync(process.env.EXPENSE_DB_PATH);
  try {
    fixture.exec(`INSERT INTO expenses (id, expense_date, description, amount, currency, category_id, paid_by_person_id) VALUES (100, '2026-07-15', 'Euro tech', 500, 'EUR', 1, 1), (101, '2026-06-15', 'Euro old tech', 800, 'EUR', 1, 1)`);
  } finally { fixture.close(); }
  const detail = getTransactionDetailData({ id: 24 });
  assert.equal(detail.categoryMonth.totalSpend, 12.99);
  assert.equal(detail.categoryMonth.previousTotalSpend, 280);
  assert.deepEqual(detail.categoryMonth.expenses.map(row => row.id), [24]);
  assert.equal(detail.categoryMonth.dailyTotals.reduce((sum, row) => sum + row.totalSpend, 0), 12.99);
});
