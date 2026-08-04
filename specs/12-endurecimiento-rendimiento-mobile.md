# 12 — Endurecimiento preventivo de rendimiento en los juegos con motor real

> **Estado:** Implementado
> **Depende de:** [06-asteroides](06-asteroides.md), [08-implement-tetris-game](08-implement-tetris-game.md), [09-implement-arkanoid-game](09-implement-arkanoid-game.md), [10-implement-culebra-game](10-implement-culebra-game.md), [11-controles-tactiles](11-controles-tactiles.md)
> **Fecha:** 2026-08-03
> **Objetivo:** Aplicar en mobile, sin bug confirmado, un checklist cerrado de endurecimiento de rendimiento (sin allocations por frame en el loop RAF, valores de DPR/tamaño cacheados, sin redibujado innecesario de elementos estáticos, listeners táctiles revisados) a los 4 juegos con motor real, verificado con un contador de FPS visible solo en desarrollo.

## Alcance

**Incluye:**

- Helper nuevo `app/lib/use-fps-counter.ts` (hook client, mismo patrón que `use-reveal.ts`): mide FPS con `requestAnimationFrame`, expone el valor actual. Se renderiza como overlay chico solo cuando `process.env.NODE_ENV !== "production"` — invisible en producción.
- Cablear el contador en los 4 `<id>-canvas.tsx` (asteroides, tetris, arkanoid, culebra), sin alterar el HUD real del juego (overlay aparte, no reemplaza puntuación/vidas/nivel).
- Auditoría + fix del checklist cerrado en `engine.ts` y `<id>-canvas.tsx` de los 4 juegos:
  - (a) Eliminar allocations de objetos/arrays dentro del loop de `requestAnimationFrame`/`update(dt)` que se puedan mover fuera del loop o reusar.
  - (b) Cachear valores derivados de `devicePixelRatio` y dimensiones del canvas (recalcular solo en resize, no en cada frame).
  - (c) Evitar limpiar/redibujar elementos estáticos (fondo, grilla, borde de tablero) cuando no cambiaron desde el frame anterior.
  - (d) Revisar los listeners táctiles agregados en spec 11 (`touchstart`/`touchmove`/`touchend`) por trabajo redundante por evento; agregar throttle solo si se detecta trabajo innecesario repetido.
- Foco exclusivo en mobile: la verificación (criterios de aceptación) se hace en viewport mobile + throttling de CPU en Chrome DevTools (o dispositivo real).

**Fuera de alcance:**

- Cualquier cambio a reglas de juego, scoring, o mecánica (`EngineInput`/`EngineSnapshot` no cambian de forma).
- Rediseño de los controles táctiles de spec 11 — solo se revisa su costo de rendimiento, no su esquema (joystick, D-pad, gestos, drag siguen iguales).
- Verificación o garantía de rendimiento en desktop (el código es compartido, pero no hay criterio de aceptación para desktop en este spec).
- Nuevas dependencias/librerías de profiling — se usa Chrome DevTools nativo.
- Persistencia o envío de métricas de FPS a Supabase u otro backend — el contador es solo visual, efímero, dev-only.
- Juegos placeholder (sin motor real) — no reciben ningún cambio.
- Sonido, vibración háptica, o cualquier feature nueva no ligada a rendimiento.

## Modelo de datos

Sin cambios de esquema en Supabase. Único tipo nuevo, en el helper de FPS:

```typescript
// app/lib/use-fps-counter.ts
export function useFpsCounter(enabled: boolean): number; // FPS actual, redondeado; 0 antes de la primera medición
```

Sin cambios a `EngineState`, `EngineSnapshot` ni `EngineInput` de ningún motor — el checklist de rendimiento no toca la forma de los datos, solo su costo de cómputo.

## Plan de implementación

1. **Helper de FPS.** Crear `app/lib/use-fps-counter.ts` con el hook `useFpsCounter`. Paso aislado, no se usa aún en ningún componente — build sigue sano.
2. **Cablear overlay + medir baseline.** Agregar el overlay dev-only en los 4 `<id>-canvas.tsx`. Con esto se obtiene la lectura de FPS actual (baseline) en mobile antes de tocar ningún motor, sirve de referencia para comparar al final.
3. **Auditoría y fix — Asteroides.** Aplicar checklist (a)-(d) en `app/games/asteroides/engine.ts` y `asteroids-canvas.tsx`. Juego sigue jugable igual que antes, solo cambia costo interno.
4. **Auditoría y fix — Tetris.** Mismo checklist en `app/games/tetris/engine.ts` y `tetris-canvas.tsx`.
5. **Auditoría y fix — Arkanoid.** Mismo checklist en `app/games/arkanoid/engine.ts` y `arkanoid-canvas.tsx` (incluye su paso offscreen de sprites en `spritesheet.ts` si aplica el punto (c)).
6. **Auditoría y fix — Culebra.** Mismo checklist en `app/games/culebra/engine.ts` y `culebra-canvas.tsx`.
7. **Verificación manual.** Con `npm run dev`, viewport mobile + throttling de CPU en Chrome DevTools (o dispositivo real): confirmar 60 FPS sostenidos vía el overlay en los 4 juegos, sin regresión funcional (controles teclado/táctiles, scoring, pausa, game over, guardado de score idénticos a antes), y confirmar que el overlay no aparece en build de producción (`npm run build && npm start`).

## Criterios de aceptación

- [x] `app/lib/use-fps-counter.ts` existe y expone `useFpsCounter(enabled)` devolviendo el FPS actual.
- [x] El overlay de FPS es visible en los 4 juegos (asteroides, tetris, arkanoid, culebra) solo cuando `NODE_ENV !== "production"`; en `npm run build && npm start` no se renderiza.
- [x] En viewport mobile + throttling de CPU (Chrome DevTools o dispositivo real), los 4 juegos sostienen 60 FPS según el overlay, sin caídas perceptibles durante gameplay normal.
- [x] Ningún loop `requestAnimationFrame`/`update(dt)` de los 4 motores crea objetos o arrays nuevos en cada frame que se puedan evitar (checklist punto a).
- [x] Los valores derivados de `devicePixelRatio` y tamaño de canvas se recalculan solo en resize, no en cada frame, en los 4 componentes (checklist punto b).
- [x] Los elementos estáticos (fondo, grilla, borde de tablero) no se redibujan en frames donde no cambiaron, en los 4 juegos (checklist punto c).
- [x] Los listeners táctiles de spec 11 fueron revisados; si tenían trabajo redundante por evento, quedan con throttle aplicado (checklist punto d).
- [x] `EngineInput`, `EngineSnapshot` y `EngineState` de los 4 motores no cambian de forma (mismos campos, mismos tipos).
- [x] Controles de teclado, mouse y táctiles funcionan igual que antes en los 4 juegos (sin regresión de comportamiento).
- [x] Scoring, pausa, game over, reinicio y guardado de score (`saveScore`) funcionan igual que antes en los 4 juegos.
- [x] Ningún juego placeholder (sin motor real) fue modificado.
- [x] Al salir de `/jugar/[id]` no quedan `requestAnimationFrame` ni listeners colgados en ningún juego (sin regresión respecto al comportamiento ya verificado en specs previos).

## Decisiones tomadas y descartadas

- **Endurecimiento preventivo sin bug confirmado**, no una corrección de un problema real. Motivo: pedido explícito tras verificar que no hay regresión de rendimiento detectada hoy.
- **Checklist cerrado de 4 técnicas (a-d)**, no una auditoría abierta de "optimizar lo que se encuentre". Motivo: pedido explícito — evita que el plan de implementación quede vago sin causa raíz confirmada.
- **Contador de FPS dev-only, sin telemetría a Supabase.** Motivo: pedido explícito — sirve solo para verificar el criterio de 60 FPS durante el desarrollo, no es una feature de producto.
- **Foco exclusivo en mobile**, sin criterio de aceptación para desktop. Motivo: pedido explícito — el síntoma original (aunque no confirmado) se reportó en mobile.
- **Los 4 juegos con motor real incluidos por consistencia**, no solo uno. Motivo: pedido explícito — comparten el mismo patrón motor+canvas, auditar solo uno dejaría el resto sin el mismo endurecimiento.
- **No se rediseñan los controles táctiles de spec 11**, solo se revisa su costo. Motivo: ya está implementado y fuera de alcance de un spec de rendimiento.
- **Sin nuevas dependencias de profiling** — Chrome DevTools nativo alcanza. Motivo: pedido explícito, evita agregar una librería para un checklist acotado.
- **Juegos placeholder fuera de alcance.** Motivo: no tienen motor real, no aplica el checklist.
