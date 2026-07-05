const ICONS = {
  dashboard: (
    <>
      <path d="M4 12.5h6.5V20H4z" />
      <path d="M13.5 4H20v8.5h-6.5z" />
      <path d="M13.5 15.5H20V20h-6.5z" />
      <path d="M4 4h6.5v5.5H4z" />
    </>
  ),
  spending: (
    <>
      <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12z" />
      <path d="M13.5 3.6a8.5 8.5 0 0 1 6.9 6.9h-6.9z" />
    </>
  ),
  transactions: (
    <>
      <path d="M5 6.5h14" />
      <path d="M5 12h14" />
      <path d="M5 17.5h9" />
      <path d="m15.5 15.5 3 2.5 3.5-4.5" />
    </>
  ),
  people: (
    <>
      <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M16.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path d="M4.5 18.5a4.5 4.5 0 0 1 9 0" />
      <path d="M13.5 18.5a3.5 3.5 0 0 1 7 0" />
    </>
  ),
  status: (
    <>
      <rect x="4.5" y="5" width="15" height="14" rx="2.5" />
      <path d="M8 9.5h8" />
      <path d="M8 13h5" />
      <path d="m14.5 16 1.5 1.5 3-4" />
    </>
  ),
  money: (
    <>
      <path d="M12 4v16" />
      <path d="M16 7.5c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.4 2.6 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3" />
    </>
  ),
  chart: (
    <>
      <path d="M5 18.5V12" />
      <path d="M12 18.5V6" />
      <path d="M19 18.5V9.5" />
    </>
  ),
  tag: (
    <>
      <path d="m11 4.5 8.5 8.5-6.5 6.5L4.5 11V4.5z" />
      <circle cx="8.25" cy="8.25" r="1.25" />
    </>
  ),
  alert: (
    <>
      <path d="m12 4 8 14H4z" />
      <path d="M12 9v4.5" />
      <circle cx="12" cy="16.5" r=".75" fill="currentColor" stroke="none" />
    </>
  ),
  calendar: (
    <>
      <rect x="4.5" y="6" width="15" height="13.5" rx="2.5" />
      <path d="M8 3.75V8" />
      <path d="M16 3.75V8" />
      <path d="M4.5 10.5h15" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5v5l3 2" />
    </>
  ),
  trend: (
    <>
      <path d="M5 16.5 10 11l3 3 6-7" />
      <path d="M14 7h5v5" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6.5" rx="6.5" ry="2.5" />
      <path d="M5.5 6.5v8c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-8" />
      <path d="M5.5 10.5c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5" />
    </>
  ),
  wallet: (
    <>
      <path d="M4.5 7.5A2.5 2.5 0 0 1 7 5h9.5A2.5 2.5 0 0 1 19 7.5v9A2.5 2.5 0 0 1 16.5 19H7a2.5 2.5 0 0 1-2.5-2.5z" />
      <path d="M4.5 8.5H19" />
      <circle cx="15.5" cy="14" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  cart: (
    <>
      <path d="M5 6h2l1.4 7h8.7l1.4-5H8.2" />
      <circle cx="10" cy="17.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="17.5" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  transport: (
    <>
      <rect x="5" y="7" width="14" height="8" rx="2" />
      <path d="M8 15v2.5" />
      <path d="M16 15v2.5" />
      <path d="M7.5 11h9" />
      <circle cx="8" cy="15.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="15.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  home: (
    <>
      <path d="m4.5 11.5 7.5-6 7.5 6" />
      <path d="M7 10.5V19h10v-8.5" />
    </>
  ),
  heart: (
    <>
      <path d="M12 19s-6.5-3.9-6.5-8.7A3.8 3.8 0 0 1 12 7.7a3.8 3.8 0 0 1 6.5 2.6C18.5 15.1 12 19 12 19Z" />
    </>
  ),
  device: (
    <>
      <rect x="6" y="4.5" width="12" height="15" rx="2.5" />
      <path d="M10 7.5h4" />
      <path d="M11 16.5h2" />
    </>
  ),
};

const CATEGORY_ICONS = {
  suscripciones: "wallet",
  tecnologia: "device",
  clothes: "tag",
  salud: "heart",
  support: "people",
  comida: "cart",
  supermercado: "cart",
  transporte: "transport",
  viajes: "trend",
  servicios: "home",
  alquiler: "home",
  hipoteca: "home",
  impuestos: "alert",
  mascotas: "heart",
  educacion: "calendar",
};

export function AppIcon({ name, className = "" }) {
  return (
    <svg
      className={`app-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name] || ICONS.dashboard}
    </svg>
  );
}

export function CategoryIcon({ slug, className = "" }) {
  return <AppIcon name={CATEGORY_ICONS[slug] || "tag"} className={className} />;
}
