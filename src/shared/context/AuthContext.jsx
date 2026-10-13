import { useCallback, useEffect, useMemo, useState } from "react";

import { activateAccessRequest, activateDoctorRequest, loginRequest, meRequest } from "../../api/endpoints/auth";
import { clearToken, getToken, setCountryCode, setToken } from "../../api/tokenStore";
import { setRefreshToken } from "../../api/tokenStore";
import { normalizeRole } from "../../config/accessConfig";
import { AuthContext } from "./authContextObject";

const normalizeUser = (payload) => {
  const activeProfile = payload.doctor_profile || payload.secretary_profile || payload.nurse_profile || {};
  const countryContext = payload.country_context || {};
  const country = countryContext.selected_country || activeProfile.country || null;
  const displayName = payload.display_name || activeProfile.display_name || payload.full_name || payload.name || activeProfile.full_name || payload.username;

  return {
    id: payload.id,
    username: payload.email || payload.public_email || payload.full_name,
    email: payload.email,
    name: displayName,
    displayName,
    role: normalizeRole(payload.role),
    roleLabel: payload.role || "DOCTOR",
    country,
    countryCode: country?.code || "",
    availableCountries: countryContext.available_countries || [],
    isGlobalAdmin: Boolean(countryContext.is_global_admin),
    isUnrestricted: Boolean(countryContext.is_unrestricted),
    company: activeProfile.company || "",
    zone: activeProfile.zone || "",
    doctorProfile: payload.doctor_profile,
    secretaryProfile: payload.secretary_profile,
    nurseProfile: payload.nurse_profile,
  };
};

export function AuthProvider({ children }) {
  const [token, setAccessToken] = useState(getToken());
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(Boolean(token));

  const applyUserPayload = useCallback((payload) => {
    const normalized = normalizeUser(payload);
    if (!normalized.isGlobalAdmin && normalized.countryCode) {
      setCountryCode(normalized.countryCode);
    } else if (normalized.isGlobalAdmin && !normalized.countryCode) {
      setCountryCode("");
    }
    setUser(normalized);
    return normalized;
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;
    meRequest()
      .then((payload) => {
        if (isMounted) {
          applyUserPayload(payload);
        }
      })
      .catch(() => {
        clearToken();
        if (isMounted) {
          setAccessToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsInitializing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [applyUserPayload, token]);

  const login = useCallback(async ({ email, password, username }) => {
    const tokens = await loginRequest({ email, username, password });
    setToken(tokens.access);
    setRefreshToken(tokens.refresh);
    setAccessToken(tokens.access);

    const payload = await meRequest();
    applyUserPayload(payload);
  }, [applyUserPayload]);

  const activateDoctor = useCallback(async ({ identifier, email, password, passwordConfirm }) => {
    const tokens = await activateDoctorRequest({ identifier, email, password, passwordConfirm });
    setToken(tokens.access);
    setRefreshToken(tokens.refresh);
    setAccessToken(tokens.access);

    const payload = await meRequest();
    applyUserPayload(payload);
  }, [applyUserPayload]);

  const activateAccess = useCallback(async ({ role, identifier, email, password, passwordConfirm }) => {
    const tokens = await activateAccessRequest({ role, identifier, email, password, passwordConfirm });
    setToken(tokens.access);
    setRefreshToken(tokens.refresh);
    setAccessToken(tokens.access);

    const payload = await meRequest();
    applyUserPayload(payload);
  }, [applyUserPayload]);

  const refreshUser = useCallback(async () => {
    const payload = await meRequest();
    return applyUserPayload(payload);
  }, [applyUserPayload]);

  const selectCountry = useCallback(async (countryCode) => {
    setCountryCode(countryCode);
    const payload = await meRequest();
    return applyUserPayload(payload);
  }, [applyUserPayload]);

  const logout = useCallback(() => {
    clearToken();
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      isInitializing,
      activateDoctor,
      activateAccess,
      login,
      logout,
      refreshUser,
      selectCountry,
      user,
    }),
    [activateAccess, activateDoctor, isInitializing, login, logout, refreshUser, selectCountry, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
