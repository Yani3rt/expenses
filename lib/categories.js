const CATEGORY_COLORS = {
  suscripciones: "violet",
  tecnologia: "cyan",
  clothes: "pink",
  salud: "emerald",
  support: "indigo",
  comida: "amber",
  supermercado: "emerald",
  transporte: "blue",
  viajes: "blue",
  servicios: "blue",
  alquiler: "primary",
  hipoteca: "primary",
  impuestos: "coral",
  mascotas: "amber",
  educacion: "indigo",
};

export function categoryTone(slug) {
  return CATEGORY_COLORS[slug] || "muted";
}
