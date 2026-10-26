import { useEffect, useState } from "react";

import { getCurrentTerms } from "../../../shared/services/catalogService";

// Carga los terminos vigentes y expone su estado al formulario padre.
export function useCurrentTerms() {
  const [state, setState] = useState({ status: "loading", terms: null });

  useEffect(() => {
    let isMounted = true;
    getCurrentTerms()
      .then((terms) => isMounted && setState({ status: "ready", terms }))
      .catch((error) => {
        if (isMounted) {
          setState({ status: error.response?.status === 404 ? "missing" : "error", terms: null });
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
