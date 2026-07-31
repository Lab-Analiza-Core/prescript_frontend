import { useCallback, useEffect, useMemo, useState } from "react";

import { activateDoctorRequest, loginRequest, meRequest } from "../../api/endpoints/auth";
import { clearToken, getToken, setToken } from "../../api/tokenStore";
import { setRefreshToken } from "../../api/tokenStore";
import { normalizeRole } from "../../config/accessConfig";
import { AuthContext } from "./authContextObject";

const normalizeUser = (payload) => ({
  id: payload.id,
  username: payload.email || payload.public_email || payload.full_name,
  email: payload.email,
  name: payload.full_name || payload.name || payload.username,
  role: normalizeRole(payload.role),
  roleLabel: payload.role || "DOCTOR",
  country: payload.doctor_profile?.country || "HN",
  company: payload.doctor_profile?.company || "Prescript",
  zone: payload.doctor_profile?.zone || "Centro",
  doctorProfile: payload.doctor_profile || payload,
});

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
      login,
      logout,
      refreshUser,
      user,
    }),
    [activateDoctor, isInitializing, login, logout, refreshUser, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
