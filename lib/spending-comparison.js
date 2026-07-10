function round(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function sumCategories(categories) {
  return round(categories.reduce((total, category) => total + Number(category.totalSpend || 0), 0));
}

function comparisonDirection(currentTotal, previousTotal) {
  if (previousTotal === 0 && currentTotal > 0) return "new";
  if (currentTotal > previousTotal) return "up";
  if (currentTotal < previousTotal) return "down";
  return "flat";
}

function historicalRows(categories, total) {
  return categories
    .map((category) => ({
      ...category,
      totalSpend: round(category.totalSpend),
      sharePercent: total > 0 ? round((Number(category.totalSpend || 0) / total) * 100) : 0,
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend || a.category.localeCompare(b.category));
}

export function buildSpendingComparison({
  activeMonth,
  previousMonth,
  currentCategories = [],
  previousCategories = [],
}) {
  const currentTotal = sumCategories(currentCategories);

  if (activeMonth === "all") {
    return {
      mode: "historical",
      activeMonth,
      previousMonth: null,
      currentTotal,
      previousTotal: null,
      deltaAmount: null,
      deltaPercent: null,
      rows: historicalRows(currentCategories, currentTotal),
    };
  }

  const previousTotal = sumCategories(previousCategories);
  const deltaAmount = round(currentTotal - previousTotal);
  const deltaPercent = previousTotal > 0 ? round((deltaAmount / previousTotal) * 100) : null;
  const currentBySlug = new Map(currentCategories.map((category) => [category.categorySlug, category]));
  const previousBySlug = new Map(previousCategories.map((category) => [category.categorySlug, category]));
  const slugs = new Set([...currentBySlug.keys(), ...previousBySlug.keys()]);

  const rows = [...slugs].map((slug) => {
    const current = currentBySlug.get(slug);
    const previous = previousBySlug.get(slug);
    const rowCurrentTotal = round(current?.totalSpend);
    const rowPreviousTotal = round(previous?.totalSpend);
    const rowDeltaAmount = round(rowCurrentTotal - rowPreviousTotal);

    return {
      category: current?.category || previous?.category || slug,
      categorySlug: slug,
      currentTotal: rowCurrentTotal,
      previousTotal: rowPreviousTotal,
      deltaAmount: rowDeltaAmount,
      deltaPercent: rowPreviousTotal > 0 ? round((rowDeltaAmount / rowPreviousTotal) * 100) : null,
      direction: comparisonDirection(rowCurrentTotal, rowPreviousTotal),
      currentExpenseCount: Number(current?.expenseCount || 0),
      previousExpenseCount: Number(previous?.expenseCount || 0),
    };
  }).sort((a, b) => Math.abs(b.deltaAmount) - Math.abs(a.deltaAmount) || a.category.localeCompare(b.category));

  return {
    mode: "comparison",
    activeMonth,
    previousMonth,
    currentTotal,
    previousTotal,
    deltaAmount,
    deltaPercent,
    rows,
  };
}
