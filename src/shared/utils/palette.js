import { contrastRatio, normalizeHex } from "./theme";

// --- Conversion de color ---------------------------------------------------------------

function hexToHsl(hex) {
  const [red, green, blue] = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return [0, 0, lightness];
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue;
  if (max === red) hue = ((green - blue) / delta) % 6;
  else if (max === green) hue = (blue - red) / delta + 2;
  else hue = (red - green) / delta + 4;
  return [(hue * 60 + 360) % 360, saturation, lightness];
}

function hslToHex(hue, saturation, lightness) {
  const clamp = (value) => Math.min(1, Math.max(0, value));
  const s = clamp(saturation);
  const l = clamp(lightness);
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const offset = l - chroma / 2;
  const [red, green, blue] =
    [
      [chroma, x, 0],
      [x, chroma, 0],
      [0, chroma, x],
      [0, x, chroma],
      [x, 0, chroma],
      [chroma, 0, x],
    ][Math.floor((((hue % 360) + 360) % 360) / 60)] || [0, 0, 0];
  return normalizeHex(
    [red, green, blue]
      .map((value) => Math.round((value + offset) * 255).toString(16).padStart(2, "0"))
      .join(""),
  );
}

const tone = (hue, saturation, lightness) => hslToHex(hue, saturation, lightness);

// Oscurece o aclara `hex` (conservando el tono) hasta alcanzar el contraste pedido contra `background`.
function ensureContrast(hex, background, minRatio, direction) {
  const [hue, saturation, lightness] = hexToHsl(hex);
  let current = hex;
  for (let step = 0; step <= 100 && contrastRatio(current, background) < minRatio; step += 1) {
    const next = lightness + (direction === "darker" ? -1 : 1) * (step + 1) * 0.01;
    current = hslToHex(hue, saturation, next);
  }
  return current;
}

const darkerOn = (hex, background, minRatio) => ensureContrast(hex, background, minRatio, "darker");

// Texto blanco u oscuro, el que mejor contraste tenga sobre `background`.
const readableOn = (background, dark = "#0F172A") =>
  contrastRatio("#FFFFFF", background) >= contrastRatio(dark, background) ? "#FFFFFF" : dark;

// --- Paletas ---------------------------------------------------------------------------

// Cada paleta usa una armonia de color distinta respecto a la marca (desplazamiento de tono del acento).
const RECOMMENDATIONS = [
  { key: "monochrome", name: "Monocromatica", description: "Tonos de tu marca: sobria y uniforme.", shift: 0, menu: "dark" },
  { key: "analogous", name: "Analoga", description: "Acento vecino a tu marca: suave y armonica.", shift: 35, menu: "light" },
  { key: "complementary", name: "Complementaria", description: "Acento opuesto en el circulo cromatico: contraste vivo.", shift: 180, menu: "brand" },
  { key: "triadic", name: "Triadica", description: "Acento a 120 grados: variada y equilibrada.", shift: 120, menu: "dark" },
];

function buildPalette({ shift, menu: menuStyle }, brand, minContrast) {
  const [brandHue, saturation] = hexToHsl(brand);
  const hue = brandHue;
  const sat = Math.min(saturation, 0.9);
  const neutral = Math.min(sat, 0.2);
  // Con una marca gris el tono no aporta nada: el acento parte de un azul neutro.
  const accentHue = saturation < 0.1 ? 215 : (hue + shift) % 360;
  const accentSat = shift === 0 ? sat : Math.max(Math.min(sat, 0.65), 0.45);
  const accentLight = shift === 0 ? 0.3 : 0.4;

  const surface = "#FFFFFF";
  const primary = darkerOn(brand, surface, minContrast);
  const primaryHover = darkerOn(tone(hue, sat, hexToHsl(primary)[2] - 0.08), surface, minContrast);
  const accent = darkerOn(tone(accentHue, accentSat, accentLight), surface, minContrast);
  const background = tone(hue, neutral, 0.94);
  const textColor = tone(hue, Math.min(sat, 0.35), 0.1);

  const base = {
    primary,
    primary_hover: primaryHover,
    accent,
    surface,
    background,
    text: textColor,
    text_secondary: darkerOn(tone(hue, Math.min(sat, 0.2), 0.34), background, minContrast),
    border: tone(hue, neutral, 0.85),
    button_primary_bg: primary,
    button_primary_text: readableOn(primary),
    button_secondary_bg: surface,
    button_secondary_text: textColor,
  };

  const activeBg = tone(accentHue, Math.min(accentSat, 0.5), 0.94);
  let menu;
  if (menuStyle === "light") {
    const sidebarBg = tone(hue, neutral, 0.97);
    menu = {
      sidebar_bg: sidebarBg,
      sidebar_text: darkerOn(tone(hue, Math.min(sat, 0.3), 0.2), sidebarBg, minContrast),
      sidebar_active_bg: tone(accentHue, Math.min(accentSat, 0.6), 0.9),
      sidebar_active_text: darkerOn(primaryHover, tone(accentHue, Math.min(accentSat, 0.6), 0.9), minContrast),
    };
  } else if (menuStyle === "brand") {
    const sidebarBg = darkerOn(tone(hue, sat, 0.3), "#FFFFFF", 7);
    menu = {
      sidebar_bg: sidebarBg,
      sidebar_text: readableOn(sidebarBg),
      sidebar_active_bg: activeBg,
      sidebar_active_text: darkerOn(sidebarBg, activeBg, minContrast),
    };
  } else {
    const sidebarBg = tone(hue, Math.min(sat, 0.45), 0.12);
    menu = {
      sidebar_bg: sidebarBg,
      sidebar_text: tone(hue, 0.25, 0.86),
      sidebar_active_bg: activeBg,
      sidebar_active_text: darkerOn(primaryHover, activeBg, minContrast),
    };
  }

  return { ...base, ...menu };
}

// Devuelve paletas completas (solo tokens de marca, fondo, texto, menu y botones principal/secundario).
// El contraste de cada par de texto cumple `minContrast`; los estados (exito, aviso, error) no se tocan.
export function recommendPalettes(brandHex, minContrast = 4.5) {
  const brand = normalizeHex(brandHex);
  return RECOMMENDATIONS.map((recommendation) => ({
    key: recommendation.key,
    name: recommendation.name,
    description: recommendation.description,
    colors: buildPalette(recommendation, brand, minContrast),
  }));
}
