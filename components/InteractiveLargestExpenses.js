"use client";

import { useState } from "react";
import RangeTabs from "./RangeTabs.js";
import { CategoryIcon } from "./Icons.js";
import { categoryTone } from "../lib/categories.js";
import { money, shortDate } from "../lib/format.js";

const LARGEST_EXPENSE_RANGE_OPTIONS = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

export default function InteractiveLargestExpenses({ expensesByRange = {}, className = "span-5" }) {
  const [range, setRange] = useState("month");
  const expenses = expensesByRange[range] || [];

  return (
    <section className={`card ${className}`.trim()}>
      <div className="section-head largest-expenses-head">
        <div>
          <p className="label">Highest amounts</p>
          <h2>Largest expenses</h2>
        </div>
        <RangeTabs
          options={LARGEST_EXPENSE_RANGE_OPTIONS}
          value={range}
          onChange={setRange}
          label="Largest expenses period"
          className="largest-expenses-tabs"
        />
      </div>
      <div className="expense-list" role="tabpanel" aria-live="polite">
        {expenses.length ? expenses.map((expense) => (
          <article className="expense-row" key={`${range}-${expense.id}`}>
            <div className={`expense-icon tone-${categoryTone(expense.categorySlug)}`}>
              <CategoryIcon slug={expense.categorySlug} />
            </div>
            <div className="expense-copy">
              <strong>{expense.description}</strong>
              <span className="expense-meta">{shortDate(expense.date)} · {expense.paidBy}</span>
            </div>
            <b className="expense-amount">{money(expense.amount, expense.currency)}</b>
          </article>
        )) : (
          <div className="largest-expenses-empty">
            <strong>No expenses this {range}</strong>
            <span>Nothing was recorded for this {range}.</span>
          </div>
        )}
      </div>
    </section>
  );
}
