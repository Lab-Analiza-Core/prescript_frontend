import { useCallback, useEffect, useMemo, useState } from "react";

import { activateAccessRequest, activateDoctorRequest, loginRequest, meRequest } from "../../api/endpoints/auth";
import { clearToken, getToken, setToken } from "../../api/tokenStore";
import { setRefreshToken } from "../../api/tokenStore";
import { normalizeRole } from "../../config/accessConfig";
import { AuthContext } from "./authContextObject";

const normalizeUser = (payload) => {
  const activeProfile = payload.doctor_profile || payload.secretary_profile || payload.nurse_profile || {};

  return {
    id: payload.id,
    username: payload.email || payload.public_email || payload.full_name,
    email: payload.email,
    name: payload.full_name || payload.name || activeProfile.full_name || payload.username,
    role: normalizeRole(payload.role),
    roleLabel: payload.role || "DOCTOR",
    country: activeProfile.country || "HN",
    company: activeProfile.company || "Prescript",
    zone: activeProfile.zone || "Centro",
    doctorProfile: payload.doctor_profile,
    secretaryProfile: payload.secretary_profile,
    nurseProfile: payload.nurse_profile,
  };
};

export function AuthProvider({ children }) {
  const [token, setAccessToken] = useState(getToken());
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;
    meRequest()
      .then((payload) => {
        if (isMounted) {
          setUser(normalizeUser(payload));
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
  }, [token]);

  const login = useCallback(async ({ email, password, username }) => {
    const tokens = await loginRequest({ email, username, password });
    setToken(tokens.access);
    setRefreshToken(tokens.refresh);
    setAccessToken(tokens.access);

    const payload = await meRequest();
    setUser(normalizeUser(payload));
  }, []);

  const activateDoctor = useCallback(async ({ identifier, email, password, passwordConfirm }) => {
    const tokens = await activateDoctorRequest({ identifier, email, password, passwordConfirm });
    setToken(tokens.access);
    setRefreshToken(tokens.refresh);
    setAccessToken(tokens.access);

    const payload = await meRequest();
    setUser(normalizeUser(payload));
  }, []);

  const activateAccess = useCallback(async ({ role, identifier, email, password, passwordConfirm }) => {
    const tokens = await activateAccessRequest({ role, identifier, email, password, passwordConfirm });
    setToken(tokens.access);
    setRefreshToken(tokens.refresh);
    setAccessToken(tokens.access);

    const payload = await meRequest();
    setUser(normalizeUser(payload));
  }, []);

  const refreshUser = useCallback(async () => {
    const payload = await meRequest();
    const normalized = normalizeUser(payload);
    setUser(normalized);
    return normalized;
  }, []);

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
      user,
    }),
    [activateAccess, activateDoctor, isInitializing, login, logout, refreshUser, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
