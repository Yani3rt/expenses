export function money(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function localNoonDate(year, month, day = 1) {
  // Avoid timezone drift for SQLite YYYY-MM-DD values rendered in browsers west of UTC.
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function shortDate(value) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    localNoonDate(year, month, day)
  );
}

export function monthLabel(value) {
  if (!value) return "No data";
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    localNoonDate(year, month, 1)
  );
}

export function compactNumber(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(value || 0));
}
