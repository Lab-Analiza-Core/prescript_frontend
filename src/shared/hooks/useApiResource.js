import { useCallback, useEffect, useEffectEvent, useState } from "react";

/**
 * Carga un recurso de la API y lo recarga cuando cambia `key` o se llama a `reload`.
 * `fetcher` puede cambiar en cada render sin disparar una nueva carga: solo `key` decide.
 * Mientras recarga conserva los datos anteriores para evitar parpadeos en las tablas.
 */
export function useApiResource(fetcher, key = "") {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ requestKey: null, data: null, error: null });
  const requestKey = `${key}|${version}`;
  const run = useEffectEvent(fetcher);

  useEffect(() => {
    let isActive = true;
    run()
      .then((data) => isActive && setState({ requestKey, data, error: null }))
      .catch((error) => isActive && setState({ requestKey, data: null, error }));
    return () => {
      isActive = false;
    };
  }, [requestKey]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return {
    data: state.data,
    error: state.error,
    isLoading: state.requestKey !== requestKey,
    reload,
  };
}
