"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { compactNumber, money } from "../lib/format.js";
import { createDialogBehaviorSession, isBackdropDismissal } from "../lib/dialog-behavior.js";
import {
  buildTransactionsUrl,
  categorySelectionLabel,
  prepareTransactionsNavigation,
  transactionsIntentFromSearchParams,
  transactionsRouteIdentity,
  toggleCategoryValue,
  updateTransactionsIntent,
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

function transactionFilterIdentity(meta) {
  return buildTransactionsUrl(
    { ...meta, q: String(meta?.q || "").trim() },
    { offset: 0 },
  );
}

export function TransactionsPresets({ meta, onSelect, className = "", pathname = "/transactions" }) {
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
            <a className={`preset-chip${isActive ? " is-active" : ""}`} href={buildTransactionsUrl(meta, nextValues, pathname)} key={option.value}>
              {option.label}
            </a>
          )
        );
      })}
    </div>
  );
}

export function ActiveFilterChips({ meta, categoryOptions, summary, onChange, onClear }) {
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

  return (
    <div className="active-filter-row" aria-label="Active transaction filters">
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
            onClick={() => onChange(chip.next)}
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
          onClick={onClear}
          type="button"
        >
          Clear all
        </button>
      ) : null}
    </div>
  );
}

function CategoryMultiselect({ categories, selectedCategories, onChange, onClearAll }) {
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

  function clearCategoriesFromSheet() {
    onChange([]);
    setIsOpen(false);
    onClearAll?.();
  }

  function categoryOptions(onClear) {
    return (
      <>
        <button
          aria-checked={selected.size === 0}
          className="category-multiselect-option"
          onClick={onClear}
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
      </>
    );
  }

  return (
    <div className="category-multiselect" ref={rootRef}>
      <div className="category-multiselect-desktop-control">
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
            {categoryOptions(clearCategories)}
          </div>
        ) : null}
      </div>

      <div className="category-multiselect-mobile-list">
        <div className="mobile-filter-field-head">
          <strong>Categories</strong>
          <span>{categorySelectionLabel(selectedCategories, categories)}</span>
        </div>
        <div
          aria-label="Categories"
          className="category-multiselect-mobile-options"
          onKeyDown={handlePanelKeyDown}
          role="group"
        >
          {categoryOptions(clearCategoriesFromSheet)}
        </div>
      </div>
    </div>
  );
}

export default function TransactionsFilters({ meta, months, categories, sourceRouteIdentity, summary }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeIntent = transactionsIntentFromSearchParams(searchParams);
  const routeIdentity = transactionsRouteIdentity(searchParams, pathname);
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [query, setQuery] = useState(meta.q);
  const [filterIntent, setFilterIntent] = useState(meta);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const filterToggleRef = useRef(null);
  const filterSheetRef = useRef(null);
  const filterIntentRef = useRef(meta);
  const queryRef = useRef(meta.q);
  const queryNeedsNavigationRef = useRef(false);
  const queryRevisionRef = useRef(0);
  const draftRouteIdentityRef = useRef(null);
  const ownedNavigationRef = useRef(null);
  const historyNavigationRef = useRef(false);
  const activeAdvancedFilterCount = [
    filterIntent.month !== "all",
    filterIntent.categories.length > 0,
    filterIntent.sort !== "newest",
  ].filter(Boolean).length;

  useEffect(() => {
    function markHistoryNavigation() {
      historyNavigationRef.current = true;
    }

    window.addEventListener("popstate", markHistoryNavigation);
    return () => window.removeEventListener("popstate", markHistoryNavigation);
  }, []);

  useLayoutEffect(() => {
    const historyNavigation = historyNavigationRef.current;
    historyNavigationRef.current = false;
    const sourceMatchesRoute = sourceRouteIdentity === routeIdentity;
    const ownedNavigation = !historyNavigation
      && ownedNavigationRef.current?.identity === routeIdentity
      ? ownedNavigationRef.current
      : null;
    if (historyNavigation || (ownedNavigation && sourceMatchesRoute)) ownedNavigationRef.current = null;
    const committedIntent = sourceMatchesRoute ? meta : routeIntent;

    const hasNewerDraft = queryNeedsNavigationRef.current
      && (draftRouteIdentityRef.current === routeIdentity
        || (ownedNavigation && queryRevisionRef.current > ownedNavigation.queryRevision));
    if (hasNewerDraft) {
      const nextIntent = { ...committedIntent, q: queryRef.current.trim() };
      filterIntentRef.current = nextIntent;
      setFilterIntent(nextIntent);
      setQuery(queryRef.current);
      return;
    }

    queryNeedsNavigationRef.current = false;
    draftRouteIdentityRef.current = null;
    filterIntentRef.current = committedIntent;
    queryRef.current = committedIntent.q;
    setFilterIntent(committedIntent);
    setQuery(committedIntent.q);
  }, [meta, routeIdentity, routeKey, sourceRouteIdentity]);

  function closeFilters() {
    setIsExpanded(false);
    window.requestAnimationFrame(() => filterToggleRef.current?.focus());
  }

  useEffect(() => {
    if (!isExpanded || !window.matchMedia("(max-width: 760px)").matches) return undefined;
    const session = createDialogBehaviorSession({ dialog: filterSheetRef.current, document, onClose: closeFilters });
    return () => session.destroy();
  }, [isExpanded]);

  function navigate(nextValues, mode = "push") {
    const navigation = prepareTransactionsNavigation(filterIntentRef.current, queryRef.current, nextValues);
    const nextIntent = navigation.intent;
    filterIntentRef.current = nextIntent;
    queryNeedsNavigationRef.current = false;
    draftRouteIdentityRef.current = null;
    queryRef.current = navigation.query;
    setFilterIntent(nextIntent);
    setQuery(navigation.query);
    const nextUrl = buildTransactionsUrl(nextIntent, {}, pathname);
    ownedNavigationRef.current = {
      identity: transactionFilterIdentity(nextIntent),
      queryRevision: queryRevisionRef.current,
    };
    startTransition(() => {
      if (mode === "replace") {
        router.replace(nextUrl);
      } else {
        router.push(nextUrl);
      }
    });
  }

  useEffect(() => {
    if (!queryNeedsNavigationRef.current) return undefined;
    const timer = setTimeout(() => {
      if (!queryNeedsNavigationRef.current) return;
      navigate({ q: queryRef.current.trim() }, "replace");
    }, 250);

    return () => clearTimeout(timer);
  }, [query, routeKey]);

  function changeQuery(nextQuery) {
    queryRevisionRef.current += 1;
    queryRef.current = nextQuery;
    queryNeedsNavigationRef.current = true;
    draftRouteIdentityRef.current = routeIdentity;
    const nextIntent = updateTransactionsIntent(filterIntentRef.current, { q: nextQuery.trim() });
    filterIntentRef.current = nextIntent;
    setFilterIntent(nextIntent);
    setQuery(nextQuery);
  }

  return (
    <>
      <div className="transactions-filter-shell" aria-busy={isPending}>
        <div className="transactions-filter-stack">
        <div className="sticky-search-bar">
          <label className="search-field compact-search-field">
            <span className="sr-only">Search</span>
            <input
              name="q"
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
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
            ref={filterToggleRef}
          >
            <span className="desktop-filter-label">More filters</span>
            <span className="mobile-filter-label">Filters</span>
            {activeAdvancedFilterCount > 0 ? <span className="filter-count">{activeAdvancedFilterCount}</span> : null}
          </button>
        </div>
        <TransactionsPresets meta={filterIntent} onSelect={navigate} className="transactions-presets-desktop" />

        <div
          className={`mobile-filter-sheet-backdrop${isExpanded ? " is-open" : ""}`}
          onMouseDown={(event) => isBackdropDismissal(event) && closeFilters()}
        >
          <section
            aria-hidden={!isExpanded}
            aria-labelledby="mobile-filter-sheet-title"
            aria-modal="true"
            className={`advanced-filters-panel mobile-filter-sheet${isExpanded ? " is-open" : ""}`}
            id="transactions-advanced-filters"
            ref={filterSheetRef}
            role="dialog"
          >
            <header className="mobile-filter-sheet-head">
              <div>
                <h2 id="mobile-filter-sheet-title">Filters</h2>
                <span>{activeAdvancedFilterCount ? `${activeAdvancedFilterCount} active` : "Narrow the ledger"}</span>
              </div>
              <button className="mobile-filter-sheet-close" type="button" onClick={closeFilters} aria-label="Close filters">×</button>
            </header>

            <div className="mobile-filter-sheet-body">
              <TransactionsPresets meta={filterIntent} onSelect={navigate} className="transactions-presets-mobile" />

              <form className="filter-card wide-filter instant-filter-card" onSubmit={(event) => event.preventDefault()}>
                <label>
                  <span className="mobile-filter-field-label" aria-hidden="true">Month</span>
                  <span className="sr-only">Month</span>
                  <select
                    name="month"
                    value={filterIntent.month}
                    onChange={(event) => navigate({ month: event.target.value, period: "all" })}
                    aria-label="Month"
                  >
                    {months.map((month) => <option value={month.value} key={month.value}>{month.label}</option>)}
                  </select>
                </label>
                <CategoryMultiselect
                  categories={categories}
                  selectedCategories={filterIntent.categories}
                  onChange={(nextCategories) => navigate({ categories: nextCategories })}
                  onClearAll={closeFilters}
                />
                <label>
                  <span className="mobile-filter-field-label" aria-hidden="true">Sort</span>
                  <span className="sr-only">Sort</span>
                  <select name="sort" value={filterIntent.sort} onChange={(event) => navigate({ sort: event.target.value })} aria-label="Sort">
                    {SORT_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </form>
            </div>

            <footer className="mobile-filter-sheet-footer">
              <button className="mobile-filter-sheet-result" type="button" onClick={closeFilters}>
                View {compactNumber(summary.expenseCount)} results
              </button>
            </footer>
          </section>
        </div>
        </div>
      </div>
      <ActiveFilterChips
        meta={filterIntent}
        categoryOptions={categories}
        summary={summary}
        onChange={navigate}
        onClear={() => navigate({
          q: "",
          period: "all",
          month: "all",
          categories: [],
          sort: "newest",
          offset: 0,
          limit: 10,
        })}
      />
    </>
  );
}
