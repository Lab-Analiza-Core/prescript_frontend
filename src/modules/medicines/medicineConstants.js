export const MEDICINE_CATEGORIES = [
  { value: "favorite", label: "Favorito" },
  { value: "complementary", label: "Complementario" },
  { value: "undetermined", label: "Sin clasificar" },
];

export const CATEGORY_LABELS = Object.fromEntries(MEDICINE_CATEGORIES.map(({ value, label }) => [value, label]));

// Identifica una entrada del catalogo: un id propio y uno sincronizado pueden coincidir.
export const entryKey = (entry) => `${entry.source}-${entry.id}`;

// Describe una entrada del catalogo en una linea: presentacion y principio activo.
export const describeMedicine = (entry) =>
  [entry.presentation, entry.active_ingredient].filter(Boolean).join(" · ") || "Sin detalle";
