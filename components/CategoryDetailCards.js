import { AppIcon, CategoryIcon } from "./Icons.js";
import { categoryTone } from "../lib/categories.js";
import { money, shortDate } from "../lib/format.js";

const CATEGORY_DESCRIPTORS = {
  suscripciones: "Fixed",
  tecnologia: "Hardware/Soft",
  clothes: "Apparel",
  salud: "Health",
  support: "Shared support",
  comida: "Dining Out",
  supermercado: "Groceries",
  transporte: "Mobility",
  viajes: "Travel",
  servicios: "Utilities",
  alquiler: "Housing",
  hipoteca: "Mortgage",
  impuestos: "Tax",
  mascotas: "Pet care",
  educacion: "Learning",
};

function moneyParts(value, currency = "USD") {
  const parts = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).formatToParts(Number(value || 0));

  return {
    currency: parts.find((part) => part.type === "currency")?.value || "$",
    integer: parts
      .filter((part) => part.type === "integer" || part.type === "group")
      .map((part) => part.value)
      .join(""),
    decimal: parts.find((part) => part.type === "decimal")?.value || ".",
    fraction: parts.find((part) => part.type === "fraction")?.value || "00",
  };
}

function descriptorForCategory(slug, name) {
  return CATEGORY_DESCRIPTORS[slug] || name;
}

function AmountDisplay({ value }) {
  const parts = moneyParts(value);

  return (
    <div className="category-card-amount">
      <span className="category-card-currency">{parts.currency}</span>
      <span className="category-card-integer">{parts.integer}</span>
      <span className="category-card-decimal">{parts.decimal}{parts.fraction}</span>
    </div>
  );
}

function CategoryStat({ label, value }) {
  return (
    <div className="category-card-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CategoryCard({ category }) {
  const tone = categoryTone(category.categorySlug);

  return (
    <article className={`category-detail-card tone-${tone}`}>
      <div className="category-card-head">
        <div>
          <h3>{category.category}</h3>
          <p>{descriptorForCategory(category.categorySlug, category.category)}</p>
        </div>
        <div className={`category-card-icon tone-${tone}`}>
          <CategoryIcon slug={category.categorySlug} />
        </div>
      </div>

      <AmountDisplay value={category.totalSpend} />

      <div className="category-card-divider" />

      <div className="category-card-stats">
        <CategoryStat label="Count" value={`${category.expenseCount} txns`} />
        <CategoryStat label="Average" value={money(category.averageExpense)} />
      </div>

      <div className="category-card-foot">
        <AppIcon name="clock" className="category-card-foot-icon" />
        <span>Last: {shortDate(category.latestDate)}</span>
      </div>
    </article>
  );
}

export default function CategoryDetailCards({ categories }) {
  if (!categories?.length) {
    return (
      <section className="card span-12 category-details-shell">
        <div className="section-head category-details-head">
          <div>
            <p className="label">Category details</p>
            <h2>Premium monthly breakdown</h2>
          </div>
        </div>
        <div className="empty-state">
          <strong>No category rows for this period.</strong>
          <span>Choose a different month to explore the breakdown.</span>
        </div>
      </section>
    );
  }

  return (
    <section className="card span-12 category-details-shell">
      <div className="category-details-grid" role="list" aria-label="Category details cards">
        {categories.map((category) => (
          <div className="category-details-item" key={category.categorySlug} role="listitem">
            <CategoryCard category={category} />
          </div>
        ))}
      </div>
    </section>
  );
}
