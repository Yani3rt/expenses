"use client";

import { useMemo, useState } from "react";
import AnimatedText from "./AnimatedText.js";
import { buildCategoryShare } from "../lib/category-share.js";
import { categoryTone } from "../lib/categories.js";
import { money } from "../lib/format.js";

function percent(value) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(Number(value || 0))}%`;
}

export default function InteractiveDonut({ categories }) {
  const [activeSlug, setActiveSlug] = useState(null);
  const [playfulSlug, setPlayfulSlug] = useState(null);
  const share = useMemo(() => buildCategoryShare(categories), [categories]);
  const safeTotal = share.totalSpend || 1;
  const circumference = 2 * Math.PI * 42;

  const slices = useMemo(() => {
    let offset = 25;
    return share.rows.map((item, index) => {
      const value = (item.totalSpend / safeTotal) * circumference;
      const slice = { ...item, dash: `${value} ${circumference - value}`, offset, index };
      offset -= value;
      return slice;
    });
  }, [circumference, safeTotal, share.rows]);

  const active = slices.find((slice) => slice.categorySlug === activeSlug) || null;

  function selectCategory(row) {
    setActiveSlug(row.categorySlug);
  }

  function playCategory(row) {
    setPlayfulSlug(row.categorySlug);
    selectCategory(row);
  }

  return (
    <section className="card span-5 donut-card">
      <div className="donut-card-head">
        <div>
          <p className="label">Category share</p>
          <h2>Where this month went</h2>
        </div>
        <button className="share-reset" type="button" onClick={() => setActiveSlug(null)} aria-pressed={!active}>
          All categories
        </button>
      </div>

      <div className="share-chart-stage">
        <div className="donut-wrap">
          <svg
            className={`donut${playfulSlug ? " is-playful" : ""}`}
            viewBox="0 0 100 100"
            role="img"
            aria-label="Category spending share chart"
            onAnimationEnd={() => setPlayfulSlug(null)}
          >
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
                  strokeDasharray={slice.dash}
                  strokeDashoffset={slice.offset}
                  tabIndex={0}
                  role="button"
                  aria-label={`Show ${slice.category} share, ${percent(slice.sharePercent)}`}
                  onMouseEnter={() => setActiveSlug(slice.categorySlug)}
                  onFocus={() => setActiveSlug(slice.categorySlug)}
                  onClick={() => playCategory(slice)}
                />
              );
            })}
          </svg>
          <div className="donut-center" key={active?.categorySlug ?? "total"}>
            {active ? (
              <>
                <AnimatedText as="strong">{percent(active.sharePercent)}</AnimatedText>
                <span>{active.category}</span>
                <AnimatedText as="small" staggerOffset={4}>{money(active.totalSpend)}</AnimatedText>
              </>
            ) : (
              <>
                <AnimatedText as="strong">100%</AnimatedText>
                <span>Total spending</span>
                <AnimatedText as="small" staggerOffset={4}>{money(share.totalSpend)}</AnimatedText>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="share-ranking" aria-label="Category share ranking">
        {share.rows.map((row, index) => {
          const isActive = row.categorySlug === active?.categorySlug;
          return (
            <button
              type="button"
              className={`share-ranking-row${isActive ? " is-active" : ""}`}
              key={row.categorySlug}
              onMouseEnter={() => setActiveSlug(row.categorySlug)}
              onFocus={() => setActiveSlug(row.categorySlug)}
              onClick={() => selectCategory(row)}
              aria-pressed={isActive}
            >
              <span className="share-rank">{index + 1}</span>
              <i className={`dot tone-${categoryTone(row.categorySlug)}`} />
              <span className="share-category">{row.category}</span>
              <strong>{money(row.totalSpend)}</strong>
            </button>
          );
        })}
      </div>
    </section>
  );
}
