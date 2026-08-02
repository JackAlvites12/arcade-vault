# 11 — Controles táctiles para los juegos con motor real

> **Estado:** Implementado
> **Depende de:** [06-asteroides](06-asteroides.md), [08-implement-tetris-game](08-implement-tetris-game.md), [09-implement-arkanoid-game](09-implement-arkanoid-game.md), [10-implement-culebra-game](10-implement-culebra-game.md)
> **Fecha:** 2026-08-01
> **Objetivo:** Agregar controles táctiles a los cuatro juegos con motor real (asteroides, tetris, arkanoid, culebra) para que sean jugables en pantalla móvil, alimentando el mismo `EngineInput` que ya usa cada motor, sin tocar lógica de motor ni de scoring.

## Alcance

**Incluye:**

- Detección de "móvil + touch" vía CSS media query (combina `max-width` y `pointer: coarse`, sin JS) en `app/globals.css`.
- HUD compacto en `app/jugar/[id]/jugar-client.tsx`, solo mientras se está jugando (no afecta `/juego/[id]`): puntuación/vidas/nivel en una fila reducida, "PAUSA"/"FIN" como botones chicos, mismo contenido que hoy pero con menor huella vertical.
- **Asteroides** (`asteroids-canvas.tsx`): joystick virtual de 2 ejes (arriba = thrust, izquierda/derecha = rotar) + botón de disparo aparte, overlay debajo del canvas. Joystick y disparo aceptan touches independientes y simultáneos (cada control trackea su propio touch id).
- **Tetris** (`tetris-canvas.tsx`): gestos directo sobre el canvas — swipe izquierda/derecha = mover una celda, tap = rotar, swipe hacia abajo = hard drop instantáneo. Sin equivalente táctil de `softDrop` (queda sin uso en touch).
- **Culebra** (`culebra-canvas.tsx`): D-pad de 4 flechas debajo del canvas, alimenta `direction`.
- **Arkanoid** (`arkanoid-canvas.tsx`): touch-drag directo sobre el canvas mapeado a `pointerX`, mismo camino que ya usa `mousemove` — sin panel de botones.
- Cada `<id>-canvas.tsx` agrega sus propios listeners táctiles (`touchstart`/`touchmove`/`touchend`), scopeados al componente y con cleanup a prueba de Strict Mode — mismo patrón que el teclado ya existente.
- Todas las áreas táctiles (canvas de los 4 juegos, overlays de controles) usan `touch-action: none` y `preventDefault()` en los handlers táctiles para que gestos/drags no disparen scroll o zoom del navegador. Cada touch se trackea por su `identifier` y se libera explícitamente en `touchend` y `touchcancel` (no solo `touchend`), para que ningún control quede "pegado" activo.
- Estilos nuevos en `app/globals.css`: HUD compacto, joystick, botones, D-pad — visibles solo bajo la media query mobile+touch.

**Fuera de alcance:**

- Juegos placeholder (sin motor real) — no reciben controles táctiles.
- Cambios a la lógica de los 4 motores (`engine.ts`) — se reusa el `EngineInput` ya existente de cada uno tal cual.
- Sonido o vibración háptica al tocar los controles.
- Preferencia persistida de esquema de control (siempre el mismo por juego).
- Gestos multi-dedo complejos (pinch, rotar con dos dedos) más allá de "cada control trackea su propio touch".
- Cambios a `app/juego/[id]` (detalle con leaderboard) — layout intacto ahí.

## Modelo de datos

Esta feature no introduce estructuras de datos nuevas. Reusa el `EngineInput` ya existente de cada motor (`app/games/asteroides/engine.ts`, `app/games/tetris/engine.ts`, `app/games/arkanoid/engine.ts`, `app/games/culebra/engine.ts`); los controles táctiles solo alimentan esos mismos campos, igual que ya hace el teclado/mouse. Sin cambios de esquema en Supabase.

## Plan de implementación

1. **CSS de detección + HUD compacto.** Agregar en `app/globals.css` la media query mobile+touch (`max-width` + `pointer: coarse`) y las clases del HUD compacto (fila reducida de puntuación/vidas/nivel, botones chicos de pausa/fin). Paso aislado, no se usa aún en ningún componente.
2. **Aplicar HUD compacto.** En `app/jugar/[id]/jugar-client.tsx`, aplicar las clases nuevas a la sección de HUD durante el juego. Desktop sigue igual (media query no aplica); mobile ya se ve compacto, aunque todavía sin controles táctiles.
3. **Arkanoid — touch-drag.** En `arkanoid-canvas.tsx`, agregar handler de `touchmove` sobre el canvas (`touch-action: none`, `preventDefault()`) que reusa el mismo cálculo de `pointerX` que ya usa `mousemove`. Arkanoid queda jugable por touch.
4. **Culebra — D-pad.** En `culebra-canvas.tsx`, agregar overlay de 4 botones (D-pad, `touch-action: none`) visible solo bajo la media query, cada botón alimenta `direction` igual que el teclado; libera el botón en `touchend`/`touchcancel`.
5. **Asteroides — joystick + disparo.** En `asteroids-canvas.tsx`, agregar overlay con joystick virtual de 2 ejes (arriba = thrust, izq/der = rotar) y botón de disparo aparte, cada control trackeando su propio `identifier` de touch (para uso simultáneo) y liberándolo en `touchend`/`touchcancel`.
6. **Tetris — gestos.** En `tetris-canvas.tsx`, agregar detección de swipe/tap sobre el canvas (`touch-action: none`, `preventDefault()`): swipe izquierda/derecha = `moveLeft`/`moveRight`, tap = `rotate`, swipe hacia abajo = `hardDrop`.
7. **Verificación manual.** Con `npm run dev` y Chrome DevTools en modo dispositivo (o dispositivo real): para los 4 juegos, confirmar HUD compacto, controles táctiles con el mismo efecto que teclado/mouse, desktop sin cambios de comportamiento, sin listeners táctiles colgados al salir de `/jugar/[id]`.

## Criterios de aceptación

- [x] En viewport móvil + touch (media query `max-width` + `pointer: coarse`), el HUD de `/jugar/[id]` se muestra compacto (puntuación/vidas/nivel en una fila, "PAUSA"/"FIN" reducidos), sin perder funcionalidad.
- [x] En desktop (fuera de la media query), el HUD y el layout de `/jugar/[id]` no cambian respecto al comportamiento actual.
- [x] `/juego/[id]` (detalle con leaderboard) no cambia de layout en ningún viewport.
- [x] En Arkanoid, arrastrar el dedo sobre el canvas mueve la paleta igual que mover el mouse (mismo `pointerX`).
- [x] En Culebra, el D-pad táctil cambia la dirección de la serpiente igual que el teclado, visible solo bajo la media query mobile+touch.
- [x] En Asteroides, el joystick virtual rota la nave (izq/der) y aplica thrust (arriba), y el botón de disparo dispara; joystick y disparo son usables al mismo tiempo (dos touches independientes).
- [x] En Tetris, swipe izquierda/derecha mueve la pieza una celda, tap rota la pieza, swipe hacia abajo ejecuta hard drop; no existe control táctil de softDrop.
- [x] Los overlays de controles táctiles (joystick, D-pad, botones) son visibles solo bajo la media query mobile+touch; en desktop no se renderizan ni ocupan espacio.
- [x] Ningún `engine.ts` de los 4 juegos cambia de firma ni de lógica (`EngineInput` idéntico al actual).
- [x] Al salir de `/jugar/[id]` no quedan listeners táctiles (`touchstart`/`touchmove`/`touchend`) colgados en ningún juego.
- [x] Teclado y mouse existentes siguen funcionando sin cambios en los 4 juegos, en cualquier viewport.
- [x] Interactuar con los controles táctiles (D-pad, joystick, botones, gestos sobre el canvas) no dispara scroll ni zoom del navegador.
- [x] Soltar o cancelar un touch (`touchend`/`touchcancel`) siempre libera el control correspondiente; ningún control queda "pegado" activo tras soltar el dedo.

## Decisiones tomadas y descartadas

- **Un solo spec para los 4 juegos**, no 4 specs separados. Motivo: pedido explícito — patrón compartido (media query + HUD compacto), evita re-derivar la misma arquitectura de detección 4 veces.
- **Detección mobile+touch vía CSS media query** (`max-width` + `pointer: coarse`), sin hook ni estado de React. Motivo: ninguna lógica de layout depende de JS — CSS puro alcanza.
- **Esquema de control distinto por juego** (joystick en asteroides, D-pad en culebra, gestos en tetris, drag en arkanoid) en vez de un control genérico único. Motivo: pedido explícito — cada motor tiene un `EngineInput` distinto; un control genérico ignoraría la mecánica real de cada juego.
- **Un touch a la vez por defecto, con excepción explícita en asteroides** (joystick + disparo simultáneos, cada uno con su propio touch id). Motivo: pedido explícito.
- **Tetris sin soft-drop táctil**, solo hard drop vía swipe hacia abajo. Motivo: pedido explícito — se prioriza gesto simple sobre paridad completa con teclado.
- **HUD se compacta, no se elimina.** Motivo: pedido explícito tras aclaración — "PAUSA"/"FIN"/"GUARDAR PUNTUACIÓN" necesitan seguir accesibles durante el juego.
- **Sin sonido ni vibración háptica** en los controles táctiles. Motivo: fuera de alcance, no pedido.
- **Sin cambios a los motores (`engine.ts`)** de los 4 juegos. Motivo: los controles táctiles solo alimentan el `EngineInput` ya existente; tocar el motor sería alcance de otro spec.
- **`touch-action: none` + `preventDefault()` en toda área táctil, y limpieza en `touchend`/`touchcancel` por `identifier`.** Motivo: mitiga en el propio plan (no como riesgo aparte) que los gestos disparen scroll/zoom del navegador o que un control quede activo tras soltar el dedo.
