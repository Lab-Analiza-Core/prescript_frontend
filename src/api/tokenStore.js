const ACCESS_TOKEN_KEY = "prescript_access_token";
const REFRESH_TOKEN_KEY = "prescript_refresh_token";
const COUNTRY_KEY = "prescript_country_code";
const sessionClearListeners = new Set();
const memoryStorage = new Map();

const readStorage = (key) => {
  try {
    return globalThis.localStorage?.getItem(key) || memoryStorage.get(key) || null;
  } catch {
    return memoryStorage.get(key) || null;
  }
};

const writeStorage = (key, value) => {
  memoryStorage.set(key, value);
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // El almacenamiento puede estar bloqueado o sin cuota; la sesion no debe romper la aplicacion.
  }
};

const removeStorage = (key) => {
  memoryStorage.delete(key);
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    // La limpieza es de mejor esfuerzo cuando el navegador bloquea el almacenamiento.
  }
};

export function getToken() {
  return readStorage(ACCESS_TOKEN_KEY);
}

export function setToken(token) {
  writeStorage(ACCESS_TOKEN_KEY, token);
}

export function getRefreshToken() {
  return readStorage(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token) {
  writeStorage(REFRESH_TOKEN_KEY, token);
}

export function getCountryCode() {
  return readStorage(COUNTRY_KEY) || "";
}

export function setCountryCode(countryCode) {
  const normalizedCode = String(countryCode || "").trim().toUpperCase();
  if (normalizedCode) {
    writeStorage(COUNTRY_KEY, normalizedCode);
  } else {
    removeStorage(COUNTRY_KEY);
  }
}

export function clearToken() {
  removeStorage(ACCESS_TOKEN_KEY);
  removeStorage(REFRESH_TOKEN_KEY);
  removeStorage(COUNTRY_KEY);
  sessionClearListeners.forEach((listener) => listener());
}

export function subscribeToSessionClear(listener) {
  sessionClearListeners.add(listener);
  return () => sessionClearListeners.delete(listener);
}
