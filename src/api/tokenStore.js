const ACCESS_TOKEN_KEY = "prescript_access_token";
const REFRESH_TOKEN_KEY = "prescript_refresh_token";
const COUNTRY_KEY = "prescript_country_code";

export function getToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function getCountryCode() {
  return localStorage.getItem(COUNTRY_KEY) || "";
}

export function setCountryCode(countryCode) {
  const normalizedCode = String(countryCode || "").trim().toUpperCase();
  if (normalizedCode) {
    localStorage.setItem(COUNTRY_KEY, normalizedCode);
  } else {
    localStorage.removeItem(COUNTRY_KEY);
  }
}

export function clearToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(COUNTRY_KEY);
}
