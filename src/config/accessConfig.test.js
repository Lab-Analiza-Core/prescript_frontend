import assert from "node:assert/strict";
import test from "node:test";

import { canAccessRoute, normalizeRole } from "./accessConfig.js";

test("no concede el rol doctor cuando el rol esta ausente", () => {
  assert.equal(normalizeRole(), "");
  assert.equal(canAccessRoute(undefined, "agenda"), false);
});

test("mantiene los alias de administrador", () => {
  assert.equal(normalizeRole("ADMIN_HN"), "admin");
  assert.equal(normalizeRole("ADMIN"), "admin");
});

test("organizaciones exige administrador global", () => {
  assert.equal(canAccessRoute("admin", "organizaciones"), false);
  assert.equal(canAccessRoute("admin", "organizaciones", { isGlobalAdmin: false }), false);
  assert.equal(canAccessRoute("admin", "organizaciones", { isGlobalAdmin: true }), true);
});

test("las demas rutas de administrador respetan el alcance por pais", () => {
  assert.equal(canAccessRoute("admin", "usuarios", { isGlobalAdmin: false }), true);
  assert.equal(canAccessRoute("doctor", "usuarios", { isGlobalAdmin: true }), false);
});

