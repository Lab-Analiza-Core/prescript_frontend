/**
 * Deduplica una operacion asincrona mientras esta en curso. Cuando termina,
 * la siguiente llamada puede iniciar una nueva ejecucion.
 */
export function createSingleFlight(operation) {
  let inFlight = null;

  return () => {
    if (!inFlight) {
      inFlight = Promise.resolve()
        .then(operation)
        .finally(() => {
          inFlight = null;
        });
    }

    return inFlight;
  };
}
