const DEFAULT_MESSAGE = "No se pudo completar la operacion. Intente de nuevo.";

// Primer mensaje legible dentro de las formas de error de DRF: texto, lista o {campo: [mensajes]}.
const findMessage = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(findMessage).find(Boolean) || "";
  if (typeof value === "object") return Object.values(value).map(findMessage).find(Boolean) || "";
  return "";
};

export function getApiErrorMessage(error, fallback = DEFAULT_MESSAGE) {
  if (error?.response?.status === 429) {
    return "Demasiados intentos. Espere unos minutos antes de intentar de nuevo.";
  }
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data.detail === "string") return data.detail;
  return findMessage(data) || fallback;
}

// Errores por campo ({email: ["..."]}) para marcar el input que fallo.
export function getApiFieldErrors(error) {
  const data = error?.response?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  return Object.fromEntries(
    Object.entries(data)
      .map(([field, value]) => [field, findMessage(value)])
      .filter(([, message]) => message),
  );
}
