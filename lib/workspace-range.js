const RANGE_DAYS = Object.freeze({
  "1w": 7,
  "1y": 365,
});

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short", day: "numeric", timeZone: "UTC",
});
const YEAR_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
});

function dateKeyFromLocalDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateKey(value) {
  const match = ISO_DATE.exec(String(value || ""));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(value, days) {
  const date = parseDateKey(value);
  date.setUTCDate(date.getUTCDate() + days);
  return dateKey(date);
}

function rangeLabel(from, end) {
  const start = parseDateKey(from);
  const finish = parseDateKey(end);
  const sameYear = start.getUTCFullYear() === finish.getUTCFullYear();
  return `${sameYear ? SHORT_DATE_FORMATTER.format(start) : YEAR_DATE_FORMATTER.format(start)} – ${YEAR_DATE_FORMATTER.format(finish)}`;
}

export function normalizeWorkspaceOffset(value) {
  const offset = Number(value ?? 0);
  return Number.isSafeInteger(offset) && offset >= 0 ? offset : 0;
}

export function resolveWorkspaceRange({ range = "1m", end } = {}, now = new Date()) {
  const normalizedRange = ["all", "1m", "3m"].includes(range) || Object.hasOwn(RANGE_DAYS, range) ? range : "1m";
  const today = dateKeyFromLocalDate(now);
  const requestedEnd = parseDateKey(end) ? String(end) : today;
  const normalizedEnd = requestedEnd > today ? today : requestedEnd;

  if (normalizedRange === "all") {
    return {
      range: "all", end: normalizedEnd, from: null, to: null,
      previousFrom: null, previousTo: null, days: null, label: "All time",
    };
  }

  if (normalizedRange === "1m" || normalizedRange === "3m") {
    const months = normalizedRange === "3m" ? 3 : 1;
    const selected = parseDateKey(normalizedEnd);
    const start = new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth() - months + 1, 1));
    const from = dateKey(start);
    const nextMonth = dateKey(new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth() + 1, 1)));
    const monthEnd = addDays(nextMonth, -1);
    const end = monthEnd > today ? today : monthEnd;
    return {
      range: normalizedRange, end, from, to: addDays(end, 1),
      previousFrom: dateKey(new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - months, 1))),
      previousTo: from,
      days: Math.round((parseDateKey(end) - start) / 86400000) + 1,
      label: rangeLabel(from, end),
    };
  }

  const days = RANGE_DAYS[normalizedRange];
  const from = addDays(normalizedEnd, 1 - days);
  const to = addDays(normalizedEnd, 1);
  const previousFrom = addDays(from, -days);
  return {
    range: normalizedRange,
    end: normalizedEnd,
    from,
    to,
    previousFrom,
    previousTo: from,
    days,
    label: rangeLabel(from, normalizedEnd),
  };
}

export function workspaceUrl(values = {}) {
  const params = new URLSearchParams();
  const range = ["all", "1m", "3m"].includes(values.range) || Object.hasOwn(RANGE_DAYS, values.range) ? values.range : "1m";
  params.set("range", range);
  if (parseDateKey(values.end)) params.set("end", values.end);
  if (values.currency) params.set("currency", String(values.currency));
  if (String(values.q || "").trim()) params.set("q", String(values.q).trim());
  if (values.category && values.category !== "all") params.set("category", String(values.category));
  if (["highest", "lowest"].includes(values.sort)) params.set("sort", values.sort);
  const offset = normalizeWorkspaceOffset(values.offset);
  if (offset > 0) params.set("offset", String(offset));
  return `/?${params.toString()}`;
}
