function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function currentWeekBounds(now = new Date()) {
  const anchor = new Date(now);
  anchor.setHours(12, 0, 0, 0);
  const daysSinceMonday = (anchor.getDay() + 6) % 7;
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - daysSinceMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: localDateKey(start), end: localDateKey(end) };
}
