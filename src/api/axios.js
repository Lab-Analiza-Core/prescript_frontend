import axios from "axios";

import { createSingleFlight } from "./singleFlight";
import { clearToken, getCountryCode, getRefreshToken, getToken, setRefreshToken, setToken } from "./tokenStore";

const normalizeApiBaseUrl = (value) => {
  if (!value) return "";

  const baseUrl = value.trim().replace(/\/+$/, "");
  return baseUrl.endsWith("/api/v1") ? baseUrl : `${baseUrl}/api/v1`;
};

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

if (import.meta.env.PROD && !API_BASE_URL) {
  throw new Error("VITE_API_URL must be configured for production builds.");
}

if (import.meta.env.PROD && /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(API_BASE_URL)) {
  console.warn("VITE_API_URL points to localhost. Use a public API URL for deployed production builds.");
}

const api = axios.create({
  baseURL: API_BASE_URL || "http://localhost:8003/api/v1",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const countryCode = getCountryCode();
  if (countryCode) {
    config.headers["X-Prescript-Country"] = countryCode;
  }
  return config;
});

const refreshAccessToken = createSingleFlight(async () => {
  const refresh = getRefreshToken();
  if (!refresh) {
    clearToken();
    throw new Error("No hay una sesion disponible para renovar.");
  }

  try {
    const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refresh });
    setToken(response.data.access);
    if (response.data.refresh) {
      setRefreshToken(response.data.refresh);
    }
    return response.data.access;
  } catch (error) {
    clearToken();
    throw error;
  }
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshRoute = originalRequest?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isRefreshRoute) {
      if (!getRefreshToken()) {
        clearToken();
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      try {
        const access = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401 && isRefreshRoute) {
      clearToken();
    }
    return Promise.reject(error);
  },
);

export default api;
