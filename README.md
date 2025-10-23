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
