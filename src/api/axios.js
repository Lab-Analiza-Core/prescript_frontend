import axios from "axios";

import { clearToken, getRefreshToken, getToken, setToken } from "./tokenStore";

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
  throw new Error("VITE_API_URL cannot point to localhost in production builds.");
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
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshRoute = originalRequest?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && !originalRequest?._retry && !isRefreshRoute) {
      const refresh = getRefreshToken();
      if (!refresh) {
        clearToken();
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      try {
        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refresh });
        setToken(response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearToken();
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
