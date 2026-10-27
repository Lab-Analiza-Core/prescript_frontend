# Arquitectura del frontend

El codigo se organiza por dominio dentro de `src/modules`. Cada modulo puede
contener `pages`, `components`, `hooks`, `services` y utilidades propias.

- `src/modules/*/services`: llamadas HTTP exclusivas del dominio.
- `src/shared/services`: llamadas usadas por varios dominios.
- `src/api`: cliente HTTP, sesion y compatibilidad de imports antiguos.
- `src/shared`: componentes, hooks, contextos y utilidades realmente comunes.
- `src/config`: configuracion declarativa de acceso y navegacion.

Los archivos de `src/api/endpoints` son fachadas de compatibilidad. El codigo
nuevo debe importar el servicio desde su modulo o desde `src/shared/services`;
no debe agregar logica nueva a esas fachadas.

Esta separacion mantiene la carga diferida por pagina y evita archivos barril
globales que obliguen a incluir dominios no utilizados en el bundle.


## Apariencia

Toda pantalla forma parte del cambio de apariencia. El tema (modulo Apariencia)
escribe variables CSS sobre `:root` (`--primary`, `--accent`, `--bg`, `--surface`,
`--ink`, `--muted`, `--line`, los `--btn-*`, `--success`, `--warning`, `--danger`,
el menu lateral y la tipografia) y todo lo visible debe leerlas.

- No usar colores fijos (`#hex`, `rgb()`, `hsl()`) en `src/modules`. Usar
  `var(--primary)`, `var(--surface)`, etc., o las clases de Tailwind
  `prescript-*`. `src/themeStandard.test.js` falla si aparece uno.
- Reutilizar las clases compartidas de `index.css` (`.metric-card`,
  `.detail-panel`, `.table-panel`, `.medicine-card`, `.prescription-paper`,
  `.primary-action`, `.secondary-action`, `.toolbar`, `.modal-layer`...) en lugar
  de recrear fondos, bordes o sombras. Una pantalla nueva no define su propia
  paleta.
- Si una pantalla necesita un color nuevo, se agrega como token del tema
  (backend, `theme.js` y `index.css`) para que se pueda personalizar; no se
  escribe en el modulo.
- Los modales se renderizan con `createPortal(..., document.body)`: la animacion
  de entrada de la ruta deja un `transform` que confina los elementos `fixed`.
- Al terminar una pantalla, revisarla con al menos dos temas distintos.
