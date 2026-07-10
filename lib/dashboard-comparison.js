function roundMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function toDriver(row) {
  return {
    category: row.category,
    categorySlug: row.categorySlug,
    deltaAmount: roundMoney(Number(row.currentTotal || 0) - Number(row.previousTotal || 0)),
  };
}

export function buildDashboardComparison({
  currentMonth,
  previousMonth,
  currentTotal,
  previousTotal,
  categoryRows = [],
}) {
  const normalizedCurrentTotal = roundMoney(currentTotal);
  const normalizedPreviousTotal = roundMoney(previousTotal);
  const deltaAmount = roundMoney(normalizedCurrentTotal - normalizedPreviousTotal);
  const deltaPercent = normalizedPreviousTotal > 0
    ? roundMoney((deltaAmount / normalizedPreviousTotal) * 100)
    : null;

  const drivers = categoryRows.map(toDriver);
  const primaryDriver = drivers
    .filter((driver) => driver.deltaAmount > 0)
    .sort((a, b) => b.deltaAmount - a.deltaAmount)[0] || null;
  const offsetDriver = drivers
    .filter((driver) => driver.deltaAmount < 0)
    .sort((a, b) => a.deltaAmount - b.deltaAmount)[0] || null;

  let direction = "flat";
  if (!currentMonth) direction = "none";
  else if (deltaAmount > 0) direction = "up";
  else if (deltaAmount < 0) direction = "down";

  return {
    currentMonth,
    previousMonth,
    currentTotal: normalizedCurrentTotal,
    previousTotal: normalizedPreviousTotal,
    deltaAmount,
    deltaPercent,
    direction,
    primaryDriver,
    offsetDriver,
  };
}
