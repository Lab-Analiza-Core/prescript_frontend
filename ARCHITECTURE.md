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
