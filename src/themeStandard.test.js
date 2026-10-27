import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

// Toda pantalla toma sus colores de las variables del tema (index.css), para que el modulo de
// Apariencia las cambie sin tocar codigo. El editor de apariencia es el unico que maneja colores.
const MODULES_DIR = fileURLToPath(new URL("./modules", import.meta.url));
const SOURCE_EXTENSIONS = /\.(css|jsx|js)$/;
const EXEMPT_DIRECTORY = join(MODULES_DIR, "appearance");
const HARDCODED_COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl)a?\(/;

function listSourceFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return path === EXEMPT_DIRECTORY ? [] : listSourceFiles(path);
    return SOURCE_EXTENSIONS.test(name) && !name.endsWith(".test.js") ? [path] : [];
  });
}

test("los modulos no traen colores fijos: usan las variables del tema", () => {
  const offenders = listSourceFiles(MODULES_DIR).flatMap((path) =>
    readFileSync(path, "utf8")
      .split("\n")
      .map((line, index) => ({ line, number: index + 1 }))
      .filter(({ line }) => HARDCODED_COLOR.test(line))
      .map(({ line, number }) => `${relative(MODULES_DIR, path)}:${number}  ${line.trim()}`),
  );

  assert.deepEqual(offenders, [], "Use var(--primary), var(--surface), var(--ink), var(--muted), var(--line)... en lugar de colores fijos.");
});
