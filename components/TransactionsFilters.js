"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { compactNumber, money } from "../lib/format.js";
import {
  categorySelectionLabel,
  replaceCategoryParams,
  toggleCategoryValue,
} from "../lib/transaction-filters.js";

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
  return !value || (key !== "period" && value === "all") || value === 0 || (key === "sort" && value === "newest") || (key === "limit" && Number(value) === 10);
}

function routeParams(meta, nextValues = {}) {
  const { q, period, month, categories, sort, offset, limit } = { ...meta, ...nextValues };
  return { q, period, month, categories, sort, offset, limit };
}

function applyRouteValues(params, values) {
  const { categories, ...singleValues } = values;
  for (const [key, value] of Object.entries(singleValues)) {
    if (shouldSkipParam(key, value)) continue;
    params.set(key, value);
  }
  replaceCategoryParams(params, categories);
  return params;
}

export function TransactionsPresets({ meta, onSelect, className = "", pathname = "/transactions" }) {
  function buildHref(nextValues = {}) {
    const params = new URLSearchParams();
    const values = routeParams(meta, nextValues);
    applyRouteValues(params, values);
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
  const router = useRouter();
  const [, startTransition] = useTransition();
  const chips = [];

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

  const categoryChips = meta.categories.map((slug) => ({
    key: `category-${slug}`,
    label: categoryOptions.find((category) => category.slug === slug)?.name || slug,
    next: { categories: meta.categories.filter((value) => value !== slug) },
  }));
  chips.push(...categoryChips);

  if (meta.sort && meta.sort !== "newest") {
    const sortLabel = SORT_OPTIONS.find((option) => option.value === meta.sort)?.label || meta.sort;
    chips.push({ key: "sort", label: sortLabel, next: { sort: "newest" } });
  }

  if (!chips.length && !summary) return null;

  const pathname = "/transactions";

  function buildHref(nextValues = {}) {
    const params = new URLSearchParams();
    const values = routeParams(meta, nextValues);
    applyRouteValues(params, values);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function navigate(href) {
    startTransition(() => {
      router.push(href);
      router.refresh();
    });
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
          <button
            className="filter-chip"
            key={chip.key}
            onClick={() => navigate(buildHref(chip.next))}
            type="button"
          >
            <span>{chip.label}</span>
            <b>×</b>
          </button>
        ))}
      </div>
      {chips.length ? (
        <button
          className="clear-filters-link"
          onClick={() => navigate("/transactions")}
          type="button"
        >
          Clear all
        </button>
      ) : null}
    </div>
  );
}

function CategoryMultiselect({ categories, selectedCategories, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const panelId = "transactions-category-options";
  const selected = new Set(selectedCategories);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function focusFirstOption() {
    window.requestAnimationFrame(() => panelRef.current?.querySelector("button")?.focus());
  }

  function handleTriggerKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      focusFirstOption();
    }
  }

  function handlePanelKeyDown(event) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const options = [...event.currentTarget.querySelectorAll('button[role="checkbox"]:not(:disabled)')];
    const currentIndex = options.indexOf(document.activeElement);
    let nextIndex = currentIndex;
    if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % options.length;
    if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + options.length) % options.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = options.length - 1;
    event.preventDefault();
    options[nextIndex]?.focus();
  }

  function clearCategories() {
    onChange([]);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className="category-multiselect" ref={rootRef}>
      <span className="sr-only" id="transactions-category-label">Category</span>
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-labelledby="transactions-category-label transactions-category-value"
        className="category-multiselect-trigger"
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span id="transactions-category-value">{categorySelectionLabel(selectedCategories, categories)}</span>
        <span className="category-multiselect-chevron" aria-hidden="true">⌄</span>
      </button>

      {isOpen ? (
        <div
          aria-label="Categories"
          className="category-multiselect-panel"
          id={panelId}
          onKeyDown={handlePanelKeyDown}
          ref={panelRef}
          role="group"
        >
          <button
            aria-checked={selected.size === 0}
            className="category-multiselect-option"
            onClick={clearCategories}
            role="checkbox"
            type="button"
          >
            <span className="category-option-check" aria-hidden="true">{selected.size === 0 ? "✓" : ""}</span>
            <span>All categories</span>
          </button>
          {categories.map((category) => {
            const isSelected = selected.has(category.slug);
            const isUnavailable = category.expenseCount === 0 && !isSelected;
            return (
              <button
                aria-checked={isSelected}
                className="category-multiselect-option"
                disabled={isUnavailable}
                key={category.slug}
                onClick={() => onChange(toggleCategoryValue(selectedCategories, category.slug))}
                role="checkbox"
                type="button"
              >
                <span className="category-option-check" aria-hidden="true">{isSelected ? "✓" : ""}</span>
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      ) : null}
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
    meta.categories.length > 0,
    meta.sort !== "newest",
  ].filter(Boolean).length;

  useEffect(() => {
    setQuery(meta.q);
  }, [meta.q]);

  const paramsString = useMemo(() => searchParams.toString(), [searchParams]);

  function navigate(nextValues, mode = "push") {
    const params = new URLSearchParams(paramsString);
    const shouldResetOffset = ["q", "period", "month", "categories", "sort"].some((key) => key in nextValues);
    const { categories: nextCategories, ...singleValues } = nextValues;

    for (const [key, value] of Object.entries(singleValues)) {
      if (shouldSkipParam(key, value)) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    if ("categories" in nextValues) replaceCategoryParams(params, nextCategories);

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
            <CategoryMultiselect
              categories={categories}
              selectedCategories={meta.categories}
              onChange={(nextCategories) => navigate({ categories: nextCategories })}
            />
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
