"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { categoryTone } from "../lib/categories.js";
import { compactNumber, money } from "../lib/format.js";

export default function InteractiveDonut({ categories }) {
  const router = useRouter();
  const [activeSlug, setActiveSlug] = useState(categories[0]?.categorySlug ?? null);
  const total = categories.reduce((sum, item) => sum + item.totalSpend, 0) || 1;
  const circumference = 2 * Math.PI * 42;

  const slices = useMemo(() => {
    let offset = 25;
    return categories.slice(0, 7).map((item, index) => {
      const value = (item.totalSpend / total) * circumference;
      const slice = { ...item, dash: `${value} ${circumference - value}`, offset, index };
      offset -= value;
      return slice;
    });
  }, [categories, circumference, total]);

  const active = slices.find((slice) => slice.categorySlug === activeSlug) || null;

  function openCategory(categorySlug) {
    router.push(`/transactions?category=${encodeURIComponent(categorySlug)}`);
  }

  return (
    <section className="card span-5 center-card donut-card">
      <p className="label">Category share</p>
      <div className="donut-wrap">
        <svg className="donut" viewBox="0 0 100 100" role="img" aria-label="Category spending donut chart">
          <circle cx="50" cy="50" r="42" className="donut-base" />
          {slices.map((slice) => {
            const isActive = slice.categorySlug === active?.categorySlug;
            return (
              <circle
                key={slice.categorySlug}
                cx="50"
                cy="50"
                r="42"
                className={`donut-slice tone-${categoryTone(slice.categorySlug)}${isActive ? " is-active" : ""}`}
                style={{ "--slice-index": slice.index }}
                strokeDasharray={slice.dash}
                strokeDashoffset={slice.offset}
                tabIndex={0}
                role="button"
                aria-label={`Open ${slice.category} expenses`}
                onMouseEnter={() => setActiveSlug(slice.categorySlug)}
                onFocus={() => setActiveSlug(slice.categorySlug)}
                onClick={() => openCategory(slice.categorySlug)}
              />
            );
          })}
        </svg>
        <div className="donut-center" key={active?.categorySlug ?? "total"}>
          {active ? (
            <>
              <strong>{money(active.totalSpend)}</strong>
              <span>{active.category}</span>
              <small>{compactNumber(active.expenseCount)} expenses</small>
            </>
          ) : (
            <>
              <strong>{money(total)}</strong>
              <span>Total</span>
              <small>{compactNumber(categories.length)} categories</small>
            </>
          )}
        </div>
      </div>
      <div className="legend interactive-legend">
        {categories.slice(0, 6).map((category, index) => {
          const isActive = category.categorySlug === active?.categorySlug;
          return (
            <button
              type="button"
              key={category.categorySlug}
              className={`legend-pill${isActive ? " is-active" : ""}`}
              style={{ "--legend-index": index }}
              onMouseEnter={() => setActiveSlug(category.categorySlug)}
              onFocus={() => setActiveSlug(category.categorySlug)}
              onClick={() => openCategory(category.categorySlug)}
              aria-pressed={isActive}
            >
              <span className="pill">
                <i className={`dot tone-${categoryTone(category.categorySlug)}`} />
                {category.category}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
