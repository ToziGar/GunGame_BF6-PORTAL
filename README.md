# Gun Game Ultra — Guía de uso y publicación en Portal

Versión: 2.0.0

Este documento explica de forma concisa y profesional cómo funciona el modo "Gun Game Ultra", qué archivos incluye, y los pasos necesarios para preparar y publicar el mod en el Portal de Battlefield. Contiene además recomendaciones de compatibilidad (no usar imports en el archivo subido) y soluciones rápidas a problemas comunes.

## Resumen del modo

- Tipo: Free-for-all (FFA) con progresión por jugador.
- Mecánica principal: cada jugador recibe una secuencia única y aleatoria de loadouts. Al conseguir kills sube de tier. El último tier es un cuchillo que otorga la victoria.
- Características destacadas:
  - Secuencia aleatoria de armas/gadgets por jugador.
  - Rachas (streaks) que otorgan loadouts épicos temporales.
  - Anti-camping (mensajes y revelado de posición).
  - HUD en vivo que muestra progreso y racha.
  - Marcador de líder (notifica quién va en cabeza).

## Archivos incluidos

- `GunGameUltra.ts` — Script principal del modo. Este archivo contiene toda la lógica del modo.
- `GunGameUltra.json` — Manifiesto del mod (nombre, descripción, entry point, strings y metadatos).
- `README.md` — Este documento.

En el repositorio de desarrollo puede haber archivos auxiliares, tests o helpers. El artefacto que subes al Portal debe limitarse a los ficheros listados arriba.

## Requisitos para la publicación en Portal

1. El Portal espera un script autónomo (por eso NO debe incluir `import` o `require` en el archivo que subes). Todo el código que el mod necesita debe estar contenido en el archivo de entrada o ser proporcionado por el entorno del Portal.
2. El `entry` declarado en `GunGameUltra.json` debe coincidir exactamente con el nombre del script principal (`GunGameUltra.ts`).
3. Asegúrate de que el objetivo de TypeScript/compilación sea compatible con el validador del Portal (por ejemplo, ES2020 o la configuración que el Portal recomiende).

### ¿Qué hacer si el código de desarrollo usa imports? (Guía práctica)

Si tu versión local del script usa `import` para helpers (p. ej. `modlib`), haz una de estas opciones antes de subir:

- Opción A — Incluir una versión consolidada: crear una versión del script donde todas las dependencias locales estén inlined (copiar las funciones necesarias dentro de `GunGameUltra.ts`).
- Opción B — Usar el panel del Portal: si el Portal permite adjuntar módulos o archivos adicionales en el paquete, sube los módulos como archivos separados y referencia el script principal como entry (ver la documentación del Portal para "archivos adicionales" o "asset bundles").
- Opción C — Transformación de build: durante tu paso de publicación, ejecutar un bundler (por ejemplo, esbuild/rollup) que empaque todas las dependencias en un único archivo UMD/ESM compatible y subir ese resultado.

Nota: La opción más segura y compatible es subir un único archivo TypeScript (o JavaScript compilado) sin imports.

## Pasos para preparar y subir al Portal (tutorial)

1. Validación local
   - Revisa que `GunGameUltra.ts` compila sin errores en tu entorno de desarrollo.
   - Elimina `import` si lo vas a subir sin bundlear. Sustituye por versiones inlined o empaqueta en un solo archivo.

2. Prepara el manifiesto
   - Abre `GunGameUltra.json` y confirma que `entry` apunta a `GunGameUltra.ts`.
   - Ajusta `displayName`, `version`, `description` y `strings` según necesites (el Portal mostrará `displayName`).

3. Empaqueta los archivos a subir
   - Incluye exactamente los archivos que el Portal requiere: `GunGameUltra.ts` y `GunGameUltra.json`.
   - Si el Portal admite carpetas, ponlos en la raíz del paquete.

4. Subida en la interfaz del Portal
   - En la sección de mods, selecciona "Subir mod" o similar.
   - Sube `GunGameUltra.ts` como entry script. Si el Portal permite, sube `GunGameUltra.json` como manifiesto.
   - Si el Portal requiere campos adicionales (mutators, rotación de mapas, dependencias), complétalos en la UI.

5. Validación del Portal
   - El Portal ejecutará su validador. Si el validador muestra errores, copia exactamente los mensajes y revisa estos puntos:
     - Errores de sintaxis (p. ej. `unexpected token`): suelen venir de Markdown dentro del .ts o de JSX no válido. Asegúrate de subir TS puro.
     - APIs no encontradas: verifica que solo uses `mod.*` y las APIs públicas documentadas por Portal.
     - Import/require no soportados: resuelve mediante inline o bundling.

6. Correcciones rápidas más comunes
   - "tsc not found" / compilador ausente: esto ocurre en tu máquina local; en Portal puede ser diferente. Para publicar, no necesitas `tsc` en tu máquina, pero sí necesitas que el archivo sea válido para el validador. Usa un bundler o transpila localmente si tienes dudas.
   - "Promise/Map/Array.from no existen": ajusta `target`/lib de TS a ES2020 en tu build o evita APIs modernas si el Portal es limitado.
   - Mensajes excesivos en consola: sustituir console.log/console.warn por `mod`-safe wrappers o eliminar en producción.

## Recomendaciones de compatibilidad y estilo

- Evita depender de APIs globales no documentadas por Portal.
- Maneja con defensas la interacción con `mod.*` (try/catch) para evitar que un error rompa el mod.
- Mantén las cadenas de texto en `GunGameUltra.json` para facilitar traducciones futuras.
- Documenta cambios en el `version` del JSON para controlar despliegues.

## Ejemplo de checklist antes de subir

- [ ] `GunGameUltra.ts` es un único archivo sin imports (o bundlado a uno).
- [ ] `GunGameUltra.json` tiene `entry` correcto y metadatos actualizados.
- [ ] Las cadenas de usuario están definidas en `strings` y revisadas.
- [ ] Probado en local (compila o bundla sin errores).
- [ ] Hacer una pequeña prueba en servidor antes de publicar globalmente.

# Gun Game Ultra (Portal BF6)

Script y manifiesto unificados para un modo Free-For-All con progresión aleatoria por jugador.

## Archivos

- `GunGameUltra.ts`
  - Script principal del modo.
  - Genera una secuencia de loadouts (armas/gadgets) única por jugador.
  - Soporta rachas con loadouts épicos temporales, anti-camping, HUD de progreso y marcador de líder.
  - No requiere dependencias externas adicionales.

- `GunGameUltra.json`
  - Manifiesto del mod y bloque de strings.
  - Campos usados:
    - `name`: Identificador interno del mod.
    - `displayName`: Nombre mostrado.
    - `version`: Versión del modo.
    - `entry`: Archivo de entrada del script (`GunGameUltra.ts`).
    - `author`: Autor/propietario del mod.
    - `description`: Descripción breve del modo.
    - `strings`: Textos que también están embebidos en el script (duplicados para compatibilidad/documentación).

> Nota: `GunGameUltra.strings.json` no es requerido por este script. Se dejó en el repo por si deseas internacionalizar desde archivo separado en el futuro.

## Cómo funciona

- Cada jugador recibe una secuencia de `TIERS_COUNT` loadouts generada al unirse (
  el último siempre es el loadout final de cuchillo).
- Al hacer una kill, el jugador sube un tier (`upgradePlayer`).
- Si muere justo después de un upgrade (ventana corta), baja un tier (`downgradePlayer`).
- Con rachas de `STREAK_FOR_EPIC` kills, obtiene un loadout épico temporal.
- El HUD muestra progreso y racha, y se anuncia el líder global.

## Parámetros principales

- `TIERS_COUNT = 17`
- `STREAK_FOR_EPIC = 3`
- `EPIC_DURATION = 8` (s)
- `DOWNGRADE_WINDOW = 3` (s)
- `CAMP_MAX_STILL = 20` (s), `CAMP_MOVE_EPS = 2.0`

Ajusta estos valores en `GunGameUltra.ts` según tus preferencias.

## Subida al Portal

1. Asegúrate de usar `GunGameUltra.ts` como script de entrada (campo `entry` en el JSON).
2. Sube ambos archivos (`GunGameUltra.ts` y `GunGameUltra.json`).
3. Si tu proceso de publicación requiere campos adicionales (mutators, rotación de mapas, etc.),
   indícamelo y adapto el JSON en 1 minuto.

## Solución de errores comunes del Portal

- “Promise/Map/Array.from no existen”: Asegúrate de compilar/validar con `ES2020` como en `PortalSDK/tsconfig.json`.
- “APIs no disponibles”: Este script usa solo el SDK de Portal (`mod.*`). Si el validador acusa otra cosa, pásame el error exacto.
- “async/await no permitido”: `OnGameModeStarted` usa `await mod.Wait(1)`. Es válido con target moderno. Si el Portal limita esto, puedo migrar a un bucle sin `await` y programar por ticks.

## Extensiones rápidas

- Añadir/retirar loadouts: edita `LOADOUT_POOL`.
- Cambiar textos: edita el objeto `TEXT` o la sección `strings` del JSON.
- Habilitar internacionalización: mover `TEXT` a un `.strings.json` e inyectar una capa de carga.

## Licencia

Consulta `LICENSE` en la raíz del repo.

