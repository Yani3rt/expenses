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
