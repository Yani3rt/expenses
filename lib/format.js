const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const CACHED_CURRENCIES = ["USD", "EUR", "GBP", "CAD"];
const CURRENCY_FORMATTERS = new Map(CACHED_CURRENCIES.map((currency) => [
  currency,
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }),
]));

export function money(value, currency = "USD") {
  const formatter = CURRENCY_FORMATTERS.get(currency) ?? new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
  return formatter.format(Number(value || 0));
}

function localNoonDate(year, month, day = 1) {
  // Avoid timezone drift for SQLite YYYY-MM-DD values rendered in browsers west of UTC.
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function shortDate(value) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return SHORT_DATE_FORMATTER.format(localNoonDate(year, month, day));
}

export function monthLabel(value) {
  if (!value) return "No data";
  const [year, month] = value.split("-").map(Number);
  return MONTH_FORMATTER.format(localNoonDate(year, month, 1));
}

export function compactNumber(value) {
  return COMPACT_NUMBER_FORMATTER.format(Number(value || 0));
}
