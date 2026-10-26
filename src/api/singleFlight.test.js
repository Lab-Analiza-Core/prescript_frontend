import assert from "node:assert/strict";
import test from "node:test";

import { createSingleFlight } from "./singleFlight.js";

test("comparte una sola ejecucion entre llamadas concurrentes", async () => {
  let executions = 0;
  let resolveOperation;
  const operation = createSingleFlight(
    () =>
      new Promise((resolve) => {
        executions += 1;
        resolveOperation = resolve;
      }),
  );

  const first = operation();
  const second = operation();
  await Promise.resolve();

  assert.equal(executions, 1);
  assert.equal(first, second);

  resolveOperation("nuevo-token");
  assert.deepEqual(await Promise.all([first, second]), ["nuevo-token", "nuevo-token"]);
});

test("permite una nueva ejecucion despues de completar la anterior", async () => {
  let executions = 0;
  const operation = createSingleFlight(async () => {
    executions += 1;
    return executions;
  });

  assert.equal(await operation(), 1);
  assert.equal(await operation(), 2);
});

test("libera la ejecucion compartida despues de un error", async () => {
  let executions = 0;
  const operation = createSingleFlight(async () => {
    executions += 1;
    if (executions === 1) throw new Error("fallo de refresh");
    return "recuperado";
  });

  await assert.rejects(operation(), /fallo de refresh/);
  assert.equal(await operation(), "recuperado");
  assert.equal(executions, 2);
});
