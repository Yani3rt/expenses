"use client";

import Select from "./Select.js";

import { useEffect, useLayoutEffect, useReducer, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { compactNumber, money, shortDate } from "../lib/format.js";
import { workspaceUrl } from "../lib/workspace-range.js";
import { createTransactionsPageRequester, fetchTransactionDetail } from "../lib/transactions-client.js";
import { createInitialTransactionDetailState, transactionDetailReducer } from "../lib/transaction-detail-state.js";
import PeriodDatePicker from "./PeriodDatePicker.js";
import YearOverview from "./YearOverview.js";
import SpendingTrend from "./SpendingTrend.js";
import TransactionDetailDialog from "./TransactionDetailDialog.js";

const RANGES = [["1w", "1W"], ["1m", "1M"], ["3m", "3M"], ["1y", "1Y"], ["all", "All"]];
const SORTS = [["newest", "Newest"], ["highest", "Highest"], ["lowest", "Lowest"]];
const ROUTE_KEYS = ["range", "end", "currency", "q", "category", "sort"];

function routeIdentity(params) {
  return JSON.stringify(ROUTE_KEYS.map(key => [key, String(params.get(key) || "")]));
}

function changeDate(value, days) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function intentFrom(data) {
  return {
    range: data.range.range,
    end: data.range.end,
    currency: data.currency,
    q: data.meta.q,
    category: data.meta.category,
    sort: data.meta.sort,
    offset: 0,
  };
}

function apiUrl(intent, offset) {
  const home = new URL(workspaceUrl({ ...intent, offset }), "http://workspace.local");
  home.pathname = "/api/workspace";
  home.searchParams.set("limit", "20");
  return `${home.pathname}${home.search}`;
}

function comparisonText(summary, currency) {
  if (summary.previousSpend === null) return "All recorded activity";
  if (summary.previousSpend === 0) return summary.totalSpend ? "No spend in the prior period" : "No change from the prior period";
  const direction = summary.deltaAmount > 0 ? "more" : summary.deltaAmount < 0 ? "less" : "the same";
  return `${money(Math.abs(summary.deltaAmount), currency)} ${direction} than prior period`;
}

function inclusiveDays(from, to) {
  if (!from || !to) return 0;
  return Math.round((new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 86400000) + 1;
}

function CategoryRows({ data, selected, onSelect }) {
  const max = Math.max(...data.categories.map(category => category.totalSpend), 1);
  return <div className="category-list">
    {data.categories.map((category, index) => <button type="button" className={selected === category.slug ? "category-row active" : "category-row"} aria-label={`Filter by ${category.name}`} aria-pressed={selected === category.slug} key={category.slug} onClick={() => onSelect(selected === category.slug ? "all" : category.slug)}>
      <i className={`category-swatch tone-${index % 5}`} aria-hidden="true" />
      <span><strong>{category.name}</strong><small>{category.expenseCount} {category.expenseCount === 1 ? "expense" : "expenses"}</small></span>
      <b>{money(category.totalSpend, data.currency || "USD")}</b>
      <em style={{ "--share": `${Math.min(100, Math.max(0, category.totalSpend / max * 100))}%` }} aria-hidden="true" />
    </button>)}
    {!data.categories.length ? <p className="muted-empty">No categories in this period.</p> : null}
  </div>;
}

export default function SpendingWorkspace({ data, sourceRouteIdentity }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(data.meta.q);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [transactions, setTransactions] = useState(data.transactions);
  const [pageMeta, setPageMeta] = useState(data.meta);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const requester = useRef(null);
  const detailRequest = useRef(null);
  const ownedNavigation = useRef(null);
  const queryDirty = useRef(false);
  const lastAdoptedData = useRef(null);
  const intent = intentFrom(data);
  const intentRef = useRef(intent);
  if (!requester.current) requester.current = createTransactionsPageRequester();
  const [detailState, dispatchDetail] = useReducer(transactionDetailReducer, undefined, createInitialTransactionDetailState);

  useEffect(() => {
    const mark = () => {
      ownedNavigation.current = null;
      queryDirty.current = false;
      setQuery(new URLSearchParams(window.location.search).get("q") || "");
    };
    window.addEventListener("popstate", mark);
    return () => window.removeEventListener("popstate", mark);
  }, []);

  useLayoutEffect(() => {
    const dataChanged = lastAdoptedData.current !== data;
    const currentIdentity = routeIdentity(searchParams);
    const sourceAccepted = sourceRouteIdentity === currentIdentity
      && (!ownedNavigation.current || (ownedNavigation.current === currentIdentity && !pending));
    if (sourceAccepted) {
      if (dataChanged) {
        lastAdoptedData.current = data;
        requester.current.cancel();
        setTransactions(data.transactions);
        setPageMeta(data.meta);
        setLoadingMore(false);
        setLoadError("");
      }
      intentRef.current = intent;
      if (!queryDirty.current) setQuery(data.meta.q);
      ownedNavigation.current = null;
    }
  }, [data, pending, searchParams, sourceRouteIdentity]);

  useEffect(() => () => {
    requester.current.cancel();
    detailRequest.current?.abort();
  }, []);

  function navigate(next, mode = "push") {
    const nextIntent = { ...intentRef.current, ...next, offset: 0 };
    const url = workspaceUrl(nextIntent);
    const targetIdentity = routeIdentity(new URL(url, "http://workspace.local").searchParams);
    if (!ownedNavigation.current && targetIdentity === routeIdentity(searchParams)) {
      return;
    }
    requester.current.cancel();
    setLoadingMore(false);
    setLoadError("");
    intentRef.current = nextIntent;
    ownedNavigation.current = targetIdentity;
    startTransition(() => router[mode](url, { scroll: false }));
  }

  function clearFilters() {
    queryDirty.current = false;
    setQuery("");
    navigate({ q: "", category: "all", sort: "newest" });
  }

  async function loadMore() {
    if (ownedNavigation.current || pending || loadingMore || !pageMeta.hasMore) return;
    const offset = transactions.length;
    await requester.current.request(apiUrl(intentRef.current, offset), {
      onStart: () => { setLoadingMore(true); setLoadError(""); },
      onSuccess: payload => {
        setTransactions(current => [...current, ...payload.transactions]);
        setPageMeta(payload.meta);
      },
      onError: error => setLoadError(error instanceof Error ? error.message : "More transactions are temporarily unavailable."),
      onSettled: () => setLoadingMore(false),
    });
  }

  async function requestDetail(transaction) {
    detailRequest.current?.abort();
    const controller = new AbortController();
    detailRequest.current = controller;
    dispatchDetail({ type: "retry" });
    try {
      const detail = await fetchTransactionDetail(`/api/transactions/${transaction.id}`, { signal: controller.signal });
      if (!controller.signal.aborted) dispatchDetail({ type: "success", detail });
    } catch (error) {
      if (!controller.signal.aborted && error?.name !== "AbortError") dispatchDetail({ type: "failure", error: error instanceof Error ? error.message : "Unable to load transaction details." });
    }
  }

  function openDetail(transaction, trigger) {
    dispatchDetail({ type: "open", transaction, trigger });
    requestDetail(transaction);
  }

  function closeDetail() {
    detailRequest.current?.abort();
    const trigger = detailState.trigger;
    dispatchDetail({ type: "close" });
    window.requestAnimationFrame(() => trigger?.focus());
  }

  const filtersActive = Boolean(intent.q || intent.category !== "all" || intent.sort !== "newest");
  const hasNext = data.range.days && data.range.end < new Date().toLocaleDateString("en-CA");
  const averageDays = data.range.days || (data.trend.length ? inclusiveDays(data.trend[0].date, data.trend.at(-1).date) : 0);
  const displayCurrency = data.currency || "USD";

  return (
    <div id="spending" className={pending ? "spending-workspace is-pending" : "spending-workspace"}>
      <header className="workspace-heading">
        <svg className="mobile-heading-doodle" viewBox="0 0 80 100" fill="none" aria-hidden="true" focusable="false">
          <path className="doodle-star-fill" d="m25 12 7 17 19 1-15 12 4 19-16-11-17 9 6-19L2 27l18 1 5-16Z" />
          <path d="M50 55c1-12 21-14 22-2 1 9-15 10-13 21M57 84l2 1M10 69l25-5m-19 11 16-5M56 19l5-5m4 17 7-1" />
        </svg>
        <div><p className="eyebrow">Household ledger</p><h1>Spending</h1></div>
        <div className="date-controls">
          <div className="period-navigation">
            <button type="button" aria-label="Previous period" disabled={!data.range.days} onClick={() => navigate({ end: changeDate(data.range.end, -data.range.days) })}>←</button>
            <PeriodDatePicker value={data.range.end} onChange={end => navigate({ end })} />
            <button type="button" aria-label="Next period" disabled={!hasNext} onClick={() => navigate({ end: changeDate(data.range.end, data.range.days) })}>→</button>
          </div>
          <span className="date-label">{data.range.label}</span>
        </div>
      </header>

      <div className="range-bar" role="group" aria-label="Spending period">
        {RANGES.map(([value, label]) => <button type="button" className={data.range.range === value ? "active" : ""} aria-pressed={data.range.range === value} key={value} onClick={() => navigate({ range: value })}>{label}</button>)}
        {data.currencies.length > 1 ? <label className="currency-control"><span className="sr-only">Currency</span><Select aria-label="Currency" value={data.currency} onChange={event => navigate({ currency: event.target.value })}>{data.currencies.map(currency => <option key={currency}>{currency}</option>)}</Select></label> : null}
      </div>

      <section className="overview-shell">
        <div className="analysis-panel">
          <div className="total-lockup">
            <p>Total spent</p>
            <strong data-testid="workspace-total">{money(data.summary.totalSpend, displayCurrency)}</strong>
            <span>{comparisonText(data.summary, displayCurrency)}</span>
          </div>
          <dl className="summary-strip">
            <div><dt>Expenses</dt><dd>{compactNumber(data.summary.expenseCount)}</dd></div>
            <div><dt>Daily average</dt><dd>{money(averageDays ? data.summary.totalSpend / averageDays : 0, displayCurrency)}</dd></div>
            <div><dt>Avg. expense</dt><dd>{money(data.summary.averageExpense, displayCurrency)}</dd></div>
          </dl>
          {data.summary.expenseCount === 0 && data.latestDate && data.latestDate !== data.range.end ? <button className="latest-activity" type="button" onClick={() => navigate({ end: data.latestDate })}>Latest activity</button> : null}
          <SpendingTrend trend={data.trend} range={data.range} currency={displayCurrency} />
        </div>

        <aside className="category-panel" aria-labelledby="category-title">
          <div className="section-title-row desktop-category-title"><h2 id="category-title">Categories</h2><span>{data.categories.length}</span></div>
          <div className="desktop-categories"><CategoryRows data={data} selected={intent.category} onSelect={category => navigate({ category })} /></div>
          <div className="mobile-categories">
            <button className="category-disclosure-toggle" type="button" aria-expanded={categoriesOpen} aria-controls="mobile-category-list" onClick={() => setCategoriesOpen(open => !open)}>
              <span>Categories</span><span>{data.categories.length} <b aria-hidden="true">+</b></span>
            </button>
            {categoriesOpen ? <div id="mobile-category-list"><CategoryRows data={data} selected={intent.category} onSelect={category => navigate({ category })} /></div> : null}
          </div>
        </aside>
      </section>

      <YearOverview calendar={data.calendar} currency={displayCurrency} />

      <section className="ledger" id="transactions" aria-labelledby="transactions-title">
        <div className="ledger-heading">
          <div><p className="eyebrow">{compactNumber(data.meta.totalMatches)} records</p><h2 id="transactions-title">Transactions</h2></div>
          <div className="ledger-filters">
            <form className="search-field" role="search" onSubmit={event => { event.preventDefault(); queryDirty.current = false; navigate({ q: query }, "replace"); }}><label className="sr-only" htmlFor="workspace-search">Search transactions</label><input id="workspace-search" type="search" aria-label="Search transactions" placeholder="Search transactions" value={query} onChange={event => { queryDirty.current = true; setQuery(event.target.value); }} /><button type="submit" aria-label="Submit search"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg></button></form>
            <label><span className="sr-only">Sort transactions</span><Select aria-label="Sort transactions" value={intent.sort} onChange={event => navigate({ sort: event.target.value })}>{SORTS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</Select></label>
            {filtersActive ? <button className="clear-filters" type="button" onClick={clearFilters}>Clear filters</button> : null}
          </div>
        </div>
        {intent.category !== "all" ? <div className="active-category">Filtered by <strong>{data.categories.find(category => category.slug === intent.category)?.name || intent.category}</strong></div> : null}
        <div className="transaction-table" aria-label="Transactions">
          <div className="transaction-head" aria-hidden="true"><span>Date</span><span>Description</span><span>Category</span><span>Paid by</span><span>Amount</span></div>
          {transactions.map(transaction => <button className="transaction-row" data-testid="workspace-transaction" type="button" key={transaction.id} onClick={event => openDetail(transaction, event.currentTarget)}>
            <time dateTime={transaction.date}>{shortDate(transaction.date)}</time>
            <span className="transaction-description"><strong>{transaction.description}</strong>{transaction.notes ? <small>Has note</small> : null}</span>
            <span className="transaction-category">{transaction.category}</span>
            <span className="transaction-payer">{transaction.paidBy}</span>
            <b>{money(transaction.amount, transaction.currency)}</b>
          </button>)}
        </div>
        {!transactions.length ? <div className="workspace-empty"><strong>No matching transactions</strong><span>Try another period or clear the ledger filters.</span>{filtersActive ? <button type="button" onClick={clearFilters}>Clear filters</button> : null}</div> : null}
        {loadError ? <div className="load-error" role="alert"><span>{loadError}</span><button type="button" onClick={loadMore}>Try again</button></div> : null}
        {!loadError && pageMeta.hasMore ? <button className="load-more" type="button" disabled={pending || loadingMore} onClick={loadMore}>{loadingMore ? "Loading…" : "Load more"}</button> : null}
      </section>

      {(data.people.length || data.allocations.length) ? <details className="people-disclosure"><summary><span><strong>People</strong><small>Paid and allocated</small></span><span aria-hidden="true">+</span></summary><div className="people-grid"><section><h3>Paid by</h3>{data.people.map(person => <div key={person.slug}><span>{person.name}<small>{person.expenseCount} expenses</small></span><strong>{money(person.totalPaid, displayCurrency)}</strong></div>)}</section><section><h3>Allocated to</h3>{data.allocations.map(person => <div key={person.slug}><span>{person.name}<small>{person.allocationCount} allocations</small></span><strong>{money(person.totalAllocated, displayCurrency)}</strong></div>)}</section></div></details> : null}

      {detailState.transaction ? <TransactionDetailDialog transaction={detailState.transaction} detail={detailState.detail} status={detailState.status} error={detailState.error} onRetry={() => requestDetail(detailState.transaction)} onClose={closeDetail} /> : null}
    </div>
  );
}
