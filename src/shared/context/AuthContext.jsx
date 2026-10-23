import { useCallback, useEffect, useMemo, useState } from "react";

import { loginRequest, meRequest } from "../../api/endpoints/auth";
import { activateAffiliationRequest, registerExternalRequest } from "../../api/endpoints/onboarding";
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
    organization: payload.organization || null,
    isExternal: Boolean(payload.is_external),
    orgAdminProfile: payload.org_admin_profile || null,
    patientProfile: payload.patient_profile || null,
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

  // Guarda los tokens recibidos y carga el perfil; es el paso comun de login, activacion y registro.
  const startSession = useCallback(async (tokens) => {
    setToken(tokens.access);
    setRefreshToken(tokens.refresh);
    setAccessToken(tokens.access);

    const payload = await meRequest();
    return applyUserPayload(payload);
  }, [applyUserPayload]);

  const login = useCallback(async ({ email, password, username }) => {
    const tokens = await loginRequest({ email, username, password });
    await startSession(tokens);
  }, [startSession]);

  // Con revision manual no hay tokens: la cuenta queda inactiva hasta que un administrador la apruebe.
  const activateAffiliation = useCallback(async (payload) => {
    const result = await activateAffiliationRequest(payload);
    if (result.access && result.refresh) {
      await startSession(result);
    }
    return result;
  }, [startSession]);

  // Un administrador de organizacion queda pendiente de aprobacion y no recibe tokens.
  const registerExternal = useCallback(async (payload) => {
    const result = await registerExternalRequest(payload);
    if (result.access && result.refresh) {
      await startSession(result);
    }
    return result;
  }, [startSession]);

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
      activateAffiliation,
      login,
      logout,
      refreshUser,
      registerExternal,
      selectCountry,
      user,
    }),
    [
      activateAffiliation,
      isInitializing,
      login,
      logout,
      refreshUser,
      registerExternal,
      selectCountry,
      token,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
