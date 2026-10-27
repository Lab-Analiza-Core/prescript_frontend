const CACHE_KEY = "prescript_theme";

// Token del backend -> variables CSS de index.css.
const TOKEN_VARIABLES = {
  primary: ["--primary"],
  primary_hover: ["--primary-dark"],
  accent: ["--accent"],
  background: ["--bg"],
  surface: ["--surface"],
  text: ["--ink"],
  text_secondary: ["--muted"],
  border: ["--line"],
  sidebar_bg: ["--sidebar-bg"],
  sidebar_text: ["--sidebar-text"],
  sidebar_active_bg: ["--sidebar-active-bg"],
  sidebar_active_text: ["--sidebar-active-text"],
  button_primary_bg: ["--btn-primary-bg"],
  button_primary_text: ["--btn-primary-text"],
  button_secondary_bg: ["--btn-secondary-bg"],
  button_secondary_text: ["--btn-secondary-text"],
  button_danger_bg: ["--btn-danger-bg"],
  button_danger_text: ["--btn-danger-text"],
  success: ["--success"],
  warning: ["--warning"],
  error: ["--danger"],
};

const SYSTEM_STACK = '"Aptos", "Segoe UI", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

// Fuentes disponibles en el backend (FONT_CHOICES); las web se cargan solo cuando se usan.
export const FONT_FAMILIES = {
  system: { stack: SYSTEM_STACK },
  inter: { stack: `"Inter", ${SYSTEM_STACK}`, google: "Inter:wght@400;500;600;700;800" },
  "plus-jakarta-sans": { stack: `"Plus Jakarta Sans", ${SYSTEM_STACK}`, google: "Plus+Jakarta+Sans:wght@400;500;600;700;800" },
  poppins: { stack: `"Poppins", ${SYSTEM_STACK}`, google: "Poppins:wght@400;500;600;700;800" },
  lato: { stack: `"Lato", ${SYSTEM_STACK}`, google: "Lato:wght@400;700;900" },
  merriweather: { stack: `"Merriweather", Georgia, serif`, google: "Merriweather:wght@400;700;900" },
};

const FONT_LINK_ID = "prescript-theme-font";

function applyFont(fontKey) {
  const root = document.documentElement;
  const link = document.getElementById(FONT_LINK_ID);
  const font = FONT_FAMILIES[fontKey];
  if (!font || fontKey === "system") {
    root.style.removeProperty("font-family");
    link?.remove();
    return;
  }
  if (font.google) {
    const href = `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`;
    if (link) {
      if (link.getAttribute("href") !== href) link.setAttribute("href", href);
    } else {
      const element = document.createElement("link");
      element.id = FONT_LINK_ID;
      element.rel = "stylesheet";
      element.href = href;
      document.head.appendChild(element);
    }
  }
  root.style.setProperty("font-family", font.stack);
}

// Escribe las variables sobre :root; los tokens que no vienen conservan el valor de index.css.
export function applyTheme(theme) {
  if (!theme) return;
  const root = document.documentElement;
  Object.entries(TOKEN_VARIABLES).forEach(([token, variables]) => {
    variables.forEach((variable) => {
      if (theme.colors?.[token]) root.style.setProperty(variable, theme.colors[token]);
      else root.style.removeProperty(variable);
    });
  });
  applyFont(theme.font);
}

export function readCachedTheme() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
  } catch {
    return null;
  }
}

export function cacheTheme(theme) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(theme));
  } catch {
    try {
      // Si el logo no cabe en el almacenamiento, se guardan al menos los colores y la fuente.
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ...theme, logo: null }));
    } catch {
      /* sin almacenamiento: el tema se pedira de nuevo en cada carga */
    }
  }
}

// --- Contraste (WCAG) para el editor; el backend valida lo mismo al guardar -------------

const channel = (value) => {
  const ratio = value / 255;
  return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const [red, green, blue] = [1, 3, 5].map((index) => channel(parseInt(hex.slice(index, index + 2), 16)));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

export const isHexColor = (value) => /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value || "").trim());

export function normalizeHex(value) {
  const hex = String(value || "").trim().replace("#", "").toUpperCase();
  return `#${hex.length === 3 ? [...hex].map((char) => char + char).join("") : hex}`;
}

export function contrastRatio(foreground, background) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

const mixHex = (hex, target, amount) => {
  const channels = [1, 3, 5].map((index) => {
    const from = parseInt(hex.slice(index, index + 2), 16);
    return Math.round(from + (target - from) * amount)
      .toString(16)
      .padStart(2, "0");
  });
  return `#${channels.join("").toUpperCase()}`;
};

// Oscurece o aclara `color` lo minimo necesario para llegar a `minContrast` contra todos los fondos.
export function fixContrast(color, backgrounds, minContrast) {
  const passes = (candidate) => backgrounds.every((background) => contrastRatio(candidate, background) >= minContrast);
  for (let step = 1; step <= 50; step += 1) {
    const amount = step / 50;
    const darker = mixHex(color, 0, amount);
    if (passes(darker)) return darker;
    const lighter = mixHex(color, 255, amount);
    if (passes(lighter)) return lighter;
  }
  return passes("#000000") ? "#000000" : "#FFFFFF";
}
