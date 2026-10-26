import assert from "node:assert/strict";
import test from "node:test";

import {
  clearToken,
  getCountryCode,
  getRefreshToken,
  getToken,
  setCountryCode,
  setRefreshToken,
  setToken,
  subscribeToSessionClear,
} from "./tokenStore.js";

test("mantiene la sesion en memoria si localStorage no esta disponible", () => {
  const previousStorage = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: () => {
        throw new Error("storage bloqueado");
      },
      removeItem: () => {
        throw new Error("storage bloqueado");
      },
      setItem: () => {
        throw new Error("storage bloqueado");
      },
    },
  });

  try {
    setToken("access");
    setRefreshToken("refresh");
    setCountryCode("hn");

    assert.equal(getToken(), "access");
    assert.equal(getRefreshToken(), "refresh");
    assert.equal(getCountryCode(), "HN");
  } finally {
    clearToken();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: previousStorage,
    });
  }
});

test("notifica a los consumidores cuando se limpia la sesion", () => {
  let notifications = 0;
  const unsubscribe = subscribeToSessionClear(() => {
    notifications += 1;
  });

  clearToken();
  unsubscribe();
  clearToken();

  assert.equal(notifications, 1);
});
