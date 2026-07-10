function round(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function normalizeCategory(category) {
  return {
    ...category,
    totalSpend: round(category.totalSpend),
    expenseCount: Number(category.expenseCount || 0),
    isOther: false,
  };
}

export function buildCategoryShare(categories, { limit = 6 } = {}) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return { totalSpend: 0, rows: [] };
  }

  const sorted = categories
    .map(normalizeCategory)
    .sort((a, b) => b.totalSpend - a.totalSpend || a.category.localeCompare(b.category));
  const totalSpend = round(sorted.reduce((total, category) => total + category.totalSpend, 0));
  const visible = sorted.slice(0, limit);
  const overflow = sorted.slice(limit);

  if (overflow.length) {
    visible.push({
      category: "Other",
      categorySlug: "other",
      totalSpend: round(overflow.reduce((total, category) => total + category.totalSpend, 0)),
      expenseCount: overflow.reduce((total, category) => total + category.expenseCount, 0),
      isOther: true,
    });
  }

  return {
    totalSpend,
    rows: visible.map((category) => ({
      ...category,
      sharePercent: totalSpend > 0 ? round((category.totalSpend / totalSpend) * 100) : 0,
    })),
  };
}
