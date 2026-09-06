function dayNumber(date) {
  return Number.parseInt(date.slice(-2), 10);
}

export function buildCumulativeData(currentRows, previousRows) {
  const currentByDay = new Map(currentRows.map((row) => [dayNumber(row.date), row.totalSpend]));
  const previousByDay = new Map(previousRows.map((row) => [dayNumber(row.date), row.totalSpend]));
  const lastDay = Math.max(1, ...currentByDay.keys(), ...previousByDay.keys());
  let current = 0;
  let previous = 0;

  return Array.from({ length: lastDay }, (_, index) => {
    const day = index + 1;
    current += currentByDay.get(day) || 0;
    previous += previousByDay.get(day) || 0;
    return { day: `${day}`, current, previous };
  });
}

export function buildMonthlyData(rows) {
  return rows.slice(-12).map((row) => ({ ...row, label: row.month.slice(5) }));
}

export function buildDailyData(rows, range, weekBounds) {
  return rows.filter((row) => range !== "week" || (row.date >= weekBounds.start && row.date <= weekBounds.end))
    .map((row) => ({ ...row, day: `${dayNumber(row.date)}` }));
}
