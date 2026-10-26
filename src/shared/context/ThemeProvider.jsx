import { useCallback, useEffect, useMemo, useState } from "react";

import { getEffectiveTheme } from "../services/themeService";
import { applyTheme, cacheTheme, readCachedTheme } from "../utils/theme";
import { ThemeContext } from "./themeContextObject";
import { useAuth } from "./useAuth";

// Aplica el tema del usuario (organizacion > global > fabrica). Antes de autenticar y mientras
// carga se usa el ultimo tema guardado en el navegador para evitar el parpadeo.
export function ThemeProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [theme, setTheme] = useState(() => readCachedTheme());
  const userId = user?.id;

  const storeTheme = useCallback((next) => {
    applyTheme(next);
    cacheTheme(next);
    setTheme(next);
    return next;
  }, []);

  const reloadTheme = useCallback(async () => storeTheme(await getEffectiveTheme()), [storeTheme]);

  useEffect(() => {
    if (!isAuthenticated || !userId) return undefined;
    let isMounted = true;
    getEffectiveTheme()
      .then((next) => {
        if (isMounted) storeTheme(next);
      })
      .catch(() => {}); // Si falla, se conserva el tema en cache o el de fabrica.
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, storeTheme, userId]);

  const value = useMemo(() => ({ logo: theme?.logo || null, reloadTheme, theme }), [reloadTheme, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
