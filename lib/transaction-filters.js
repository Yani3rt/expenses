export function normalizeCategoryValues(value, allowedSlugs) {
  const values = (Array.isArray(value) ? value : [value])
    .flatMap((entry) => String(entry || "").split(","))
    .map((entry) => entry.trim())
    .filter((entry) => entry && entry !== "all");
  const allowed = allowedSlugs ? new Set(allowedSlugs) : null;

  return [...new Set(values.filter((entry) => !allowed || allowed.has(entry)))];
}

export function replaceCategoryParams(params, values) {
  params.delete("category");
  for (const category of normalizeCategoryValues(values)) {
    params.append("category", category);
  }
  return params;
}

export function toggleCategoryValue(values, category) {
  const selected = normalizeCategoryValues(values);
  return selected.includes(category)
    ? selected.filter((value) => value !== category)
    : [...selected, category];
}

export function categorySelectionLabel(values, catalog) {
  const selected = normalizeCategoryValues(values);
  if (!selected.length) return "All categories";
  if (selected.length > 1) return `${selected.length} categories`;
  return catalog.find((category) => category.slug === selected[0])?.name || selected[0];
}

const OFFSET_RESET_KEYS = ["q", "period", "month", "categories", "sort"];

function shouldOmitTransactionParam(key, value) {
  return value === undefined
    || value === null
    || value === ""
    || (key !== "period" && value === "all")
    || (key === "offset" && Number(value) === 0)
    || (key === "sort" && value === "newest")
    || (key === "limit" && Number(value) === 10);
}

export function updateTransactionsIntent(meta, changes = {}) {
  const values = { ...meta, ...changes };
  const hasExplicitOffset = Object.hasOwn(changes, "offset");
  if (!hasExplicitOffset && OFFSET_RESET_KEYS.some((key) => Object.hasOwn(changes, key))) {
    values.offset = 0;
  }
  return values;
}

export function prepareTransactionsNavigation(meta, query, changes = {}) {
  const currentIntent = updateTransactionsIntent(meta, { q: String(query || "").trim() });
  const intent = updateTransactionsIntent(currentIntent, changes);
  return {
    intent,
    query: Object.hasOwn(changes, "q") ? String(intent.q || "") : query,
  };
}

export function transactionsIntentFromSearchParams(params) {
  const value = (key) => {
    const raw = typeof params?.get === "function" ? params.get(key) : params?.[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };
  const values = (key) => {
    const raw = typeof params?.getAll === "function" ? params.getAll(key) : params?.[key];
    return Array.isArray(raw) ? raw : raw === undefined || raw === null ? [] : [raw];
  };
  return {
    q: value("q") || "",
    period: value("period") || "this_month",
    month: value("month") || "all",
    categories: normalizeCategoryValues(values("category")),
    sort: value("sort") || "newest",
    offset: value("offset") || 0,
    limit: value("limit") || 10,
  };
}

export function transactionsRouteIdentity(params, pathname = "/transactions") {
  return buildTransactionsUrl(transactionsIntentFromSearchParams(params), {}, pathname);
}

export function buildTransactionsUrl(meta, changes = {}, pathname = "/transactions") {
  const values = updateTransactionsIntent(meta, changes);

  const params = new URLSearchParams();
  for (const key of ["q", "period", "month"]) {
    const value = values[key];
    if (!shouldOmitTransactionParam(key, value)) params.set(key, value);
  }
  replaceCategoryParams(params, values.categories);
  for (const key of ["sort", "offset", "limit"]) {
    const value = values[key];
    if (!shouldOmitTransactionParam(key, value)) params.set(key, value);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
