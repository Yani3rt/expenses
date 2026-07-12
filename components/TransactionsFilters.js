"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { compactNumber, money } from "../lib/format.js";

const PERIOD_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_3_months", label: "Last 3 months" },
  { value: "ytd", label: "Year to date" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "highest", label: "Highest amount" },
  { value: "lowest", label: "Lowest amount" },
];

function shouldSkipParam(key, value) {
  return !value || value === "all" || value === 0 || (key === "sort" && value === "newest") || (key === "limit" && Number(value) === 10);
}

function routeParams(meta, nextValues = {}) {
  const { q, period, month, category, sort, offset, limit } = { ...meta, ...nextValues };
  return { q, period, month, category, sort, offset, limit };
}

export function TransactionsPresets({ meta, onSelect, className = "", pathname = "/transactions" }) {
  function buildHref(nextValues = {}) {
    const params = new URLSearchParams();
    const values = routeParams(meta, nextValues);
    for (const [key, value] of Object.entries(values)) {
      if (shouldSkipParam(key, value)) continue;
      params.set(key, value);
    }
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <div className={`preset-row ${className}`.trim()} role="group" aria-label="Quick date ranges">
      {PERIOD_OPTIONS.map((option) => {
        const isActive = meta.period === option.value && meta.month === "all";
        const nextValues = { period: option.value, month: "all" };
        return (
          onSelect ? (
            <button
              className={`preset-chip${isActive ? " is-active" : ""}`}
              key={option.value}
              onClick={() => onSelect(nextValues)}
              type="button"
            >
              {option.label}
            </button>
          ) : (
            <a className={`preset-chip${isActive ? " is-active" : ""}`} href={buildHref(nextValues)} key={option.value}>
              {option.label}
            </a>
          )
        );
      })}
    </div>
  );
}

export function ActiveFilterChips({ meta, categoryOptions, summary }) {
  const chips = [];
  const categoryLabel = categoryOptions.find((category) => category.slug === meta.category)?.name;

  if (meta.q) {
    chips.push({ key: "q", label: `Search: ${meta.q}`, next: { q: "" } });
  }

  if (meta.period && meta.period !== "all") {
    const periodLabel = PERIOD_OPTIONS.find((option) => option.value === meta.period)?.label || meta.period;
    chips.push({ key: "period", label: periodLabel, next: { period: "all" } });
  }

  if (meta.month && meta.month !== "all") {
    chips.push({ key: "month", label: meta.month, next: { month: "all" } });
  }

  if (meta.category && meta.category !== "all") {
    chips.push({ key: "category", label: categoryLabel || meta.category, next: { category: "all" } });
  }

  if (meta.sort && meta.sort !== "newest") {
    const sortLabel = SORT_OPTIONS.find((option) => option.value === meta.sort)?.label || meta.sort;
    chips.push({ key: "sort", label: sortLabel, next: { sort: "newest" } });
  }

  if (!chips.length && !summary) return null;

  const pathname = "/transactions";

  function buildHref(nextValues = {}) {
    const params = new URLSearchParams();
    const values = routeParams(meta, nextValues);
    for (const [key, value] of Object.entries(values)) {
      if (shouldSkipParam(key, value)) continue;
      params.set(key, value);
    }
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <div className="active-filter-row">
      {summary ? (
        <div className="filter-results-summary" aria-label="Current ledger summary">
          <strong>{compactNumber(summary.expenseCount)} matches</strong>
          <span>{money(summary.totalSpend)} total</span>
        </div>
      ) : null}
      <div className="active-filter-chips">
        {chips.map((chip) => (
          <a className="filter-chip" href={buildHref(chip.next)} key={chip.key}>
            <span>{chip.label}</span>
            <b>×</b>
          </a>
        ))}
      </div>
      {chips.length ? <a className="clear-filters-link" href="/transactions">Clear all</a> : null}
    </div>
  );
}

export default function TransactionsFilters({ meta, months, categories }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(meta.q);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const activeAdvancedFilterCount = [
    meta.month !== "all",
    meta.category !== "all",
    meta.sort !== "newest",
  ].filter(Boolean).length;

  useEffect(() => {
    setQuery(meta.q);
  }, [meta.q]);

  const paramsString = useMemo(() => searchParams.toString(), [searchParams]);

  function navigate(nextValues, mode = "push") {
    const params = new URLSearchParams(paramsString);
    const shouldResetOffset = ["q", "period", "month", "category", "sort"].some((key) => key in nextValues);

    for (const [key, value] of Object.entries(nextValues)) {
      if (shouldSkipParam(key, value)) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    if (shouldResetOffset) params.delete("offset");

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => {
      if (mode === "replace") {
        router.replace(nextUrl);
      } else {
        router.push(nextUrl);
      }
    });
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query === meta.q) return;
      navigate({ q: query }, "replace");
    }, 250);

    return () => clearTimeout(timer);
  }, [query, meta.q]);

  return (
    <div className="transactions-filter-shell" aria-busy={isPending}>
      <div className="transactions-filter-stack">
        <div className="sticky-search-bar">
          <label className="search-field compact-search-field">
            <span className="sr-only">Search</span>
            <input
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="food, t-mobile, tech…"
              aria-label="Search transactions"
            />
          </label>
          <button
            type="button"
            className={`mobile-filter-toggle${isExpanded ? " is-open" : ""}`}
            aria-expanded={isExpanded}
            aria-controls="transactions-advanced-filters"
            onClick={() => setIsExpanded((open) => !open)}
          >
            <span className="desktop-filter-label">More filters</span>
            <span className="mobile-filter-label">Filters</span>
            {activeAdvancedFilterCount > 0 ? <span className="filter-count">{activeAdvancedFilterCount}</span> : null}
          </button>
        </div>
        {isPending ? (
          <span className="filter-pending-status is-visible" role="status" aria-live="polite">
            Updating results…
          </span>
        ) : null}

        <TransactionsPresets meta={meta} onSelect={navigate} className="transactions-presets-desktop" />

        <div className={`advanced-filters-panel${isExpanded ? " is-open" : ""}`} id="transactions-advanced-filters">
          <TransactionsPresets meta={meta} onSelect={navigate} className="transactions-presets-mobile" />

          <form className="filter-card wide-filter instant-filter-card" onSubmit={(event) => event.preventDefault()}>
            <label>
              <span className="sr-only">Month</span>
              <select
                name="month"
                value={meta.month}
                onChange={(event) => navigate({ month: event.target.value, period: "all" })}
                aria-label="Month"
              >
                {months.map((month) => <option value={month.value} key={month.value}>{month.label}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Category</span>
              <select name="category" value={meta.category} onChange={(event) => navigate({ category: event.target.value })} aria-label="Category">
                <option value="all">All categories</option>
                {categories.map((category) => <option value={category.slug} key={category.slug}>{category.name}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Sort</span>
              <select name="sort" value={meta.sort} onChange={(event) => navigate({ sort: event.target.value })} aria-label="Sort">
                {SORT_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
              </select>
            </label>
          </form>
        </div>
      </div>
    </div>
  );
}
