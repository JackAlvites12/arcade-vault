# 08 — Juego Tetris

> **Estado:** Implementado
> **Depende de:** [06-asteroides](06-asteroides.md) (patrón motor+canvas), [07-leaderboard-y-tabla-juegos](07-leaderboard-y-tabla-juegos.md) (tablas `games`/`scores` en Supabase, `app/data/db.ts`)
> **Fecha:** 2026-07-28
> **Objetivo:** Portar el prototipo funcional de Tetris (`references/started-games/03-tetris/game.js`) a un motor TypeScript embebido en un componente cliente, y darle su propio juego jugable (`tetris`) dentro de la biblioteca de Arcade Vault, con leaderboard real de Supabase desde el día uno.

## Alcance

**Incluye:**

- INSERT de un nuevo registro en la tabla `games` de Supabase (vía `apply_migration`): `id: "tetris"`, `title: "TETRIS"`, `short`, `long`, `cat: "PUZZLE"`, `cover: "cover-tetro"`, `color: "cyan"`, `best: 24500`, `plays: "9.8K"`. `caida` (que hoy usa `cover-tetro` como placeholder falso) queda intacto.
- Motor portado a TypeScript en `app/games/tetris/engine.ts`: tablero 10×20, 8 tipos de pieza (7 tetrominós clásicos + la pieza "N"/tuerca), spawn aleatorio, rotación horaria con wall-kicks `[0,-1,1,-2,2]`, colisión, merge, `clearLines`, ghost piece (`ghostY`), soft drop (+1/fila) y hard drop (+2/celda), niveles (`dropInterval = max(100, 1000-(level-1)*90)`, `level = floor(lines/10)+1`), scoring por líneas (`[0,100,300,500,800] * level`) — 1:1 con `references/started-games/03-tetris/game.js`. **Sin sistema de vidas:** el estado del motor es `"playing" | "gameover"` (no hay estado intermedio de muerte/reaparición); game over inmediato cuando la pieza nueva no puede spawnear.
- Componente cliente `app/games/tetris/tetris-canvas.tsx`: `<canvas>` con loop `requestAnimationFrame` y acumulador de tiempo para el auto-drop, listeners de teclado (`←`/`→` mover, `↓` soft drop, `↑`/`KeyX` rotar, `Espacio` hard drop) con `preventDefault`, preview de "siguiente pieza" en un canvas secundario interno, ghost piece dibujado a `alpha 0.2`. Reporta `EngineSnapshot` (`score`/`lines`/`level`/`state`, sin `lives`) al padre vía `onSnapshot`, respeta prop `paused` externa, expone `restart()`/`forceGameOver()` vía `forwardRef` — mismo patrón que `AsteroidsCanvasHandle`.
- `app/jugar/[id]/jugar-client.tsx`: cuando `id === "tetris"`, renderiza `TetrisCanvas` en vez del placeholder falso; HUD muestra Puntuación/**Líneas**/Nivel (sin campo "Vidas") leído del snapshot real; "GUARDAR PUNTUACIÓN" llama `saveScore("tetris", name, score)`.
- `app/juego/[id]/page.tsx`: si `id === "tetris"`, usa `getTopScores("tetris", 10)` en vez de `seededScores`; mensaje de estado vacío si no hay filas (mismo patrón que asteroides en spec 07).
- `app/salon/salon-client.tsx`: pestaña TETRIS usa `getTopScores` real con el mismo patrón de estado vacío; el resto de pestañas no cambia.

**Fuera de alcance (para specs futuros):**

- Controles táctiles/móviles.
- Efectos de sonido.
- Hold piece, T-spin detection, combos — el prototipo original no los tiene.
- Cambios a `caida` o a los otros 6 juegos con placeholder falso.
- Cambios a `references/started-games/03-tetris/` (solo lectura).
- Ajustes de dificultad/balance distintos al prototipo original.
- Recalcular `game.best`/`game.plays` desde `scores` (quedan estáticos, igual que asteroides).
- Autenticación real / vincular `player_name` a usuario autenticado (ya fuera de alcance desde spec 07).

## Modelo de datos

Nueva fila en `games` (Supabase, vía `apply_migration`):

```sql
insert into games (id, title, short, long, cat, cover, color, best, plays) values (
  'tetris',
  'TETRIS',
  'Apila y despeja líneas antes de que la torre te sepulte.',
  'Piezas de siete formas clásicas —más una tuerca de acero fuera de catálogo— caen en una grilla de 10x20. Rotalas con wall-kicks, alineá líneas completas para despejarlas y sobrevive a una caída que se acelera con cada nivel.',
  'PUZZLE', 'cover-tetro', 'cyan', 24500, '9.8K'
);
```

Tipos nuevos del motor:

```typescript
// app/games/tetris/engine.ts
export type EngineState = "playing" | "gameover";

export interface EngineSnapshot {
  score: number;
  lines: number;
  level: number;
  state: EngineState;
}

export interface EngineInput {
  moveLeft: boolean;   // edge-triggered (una vez por pulsación)
  moveRight: boolean;  // edge-triggered
  rotate: boolean;     // edge-triggered
  softDrop: boolean;   // held (continuo mientras se mantiene ↓)
  hardDrop: boolean;   // edge-triggered
}

export class TetrisEngine {
  static readonly COLS = 10;
  static readonly ROWS = 20;
  static readonly BLOCK = 30; // tamaño en px del mundo del canvas principal (300x600)

  constructor();
  restart(): void;
  forceGameOver(): void;
  update(dt: number, input: EngineInput): void;
  draw(ctx: CanvasRenderingContext2D): void;
  drawNext(ctx: CanvasRenderingContext2D): void; // preview de la siguiente pieza, canvas secundario
  getSnapshot(): EngineSnapshot;
  // internos: board, current, next, score, lines, level, state, dropAccum, dropInterval
}
```

```typescript
// app/games/tetris/tetris-canvas.tsx
export interface TetrisCanvasHandle {
  restart(): void;
  forceGameOver(): void;
}

export interface TetrisCanvasProps {
  paused: boolean;
  onSnapshot: (snapshot: EngineSnapshot) => void;
}
// forwardRef<TetrisCanvasHandle, TetrisCanvasProps>
// Renderiza internamente el <canvas> principal + un <canvas> secundario de "siguiente pieza"
// (igual que next-canvas del prototipo); ninguno de los dos se expone al padre, solo el snapshot.
```

Nota: a diferencia de asteroides, no hay `EngineInput` de estado continuo tipo "thrust" salvo `softDrop`; el resto son ediciones edge-triggered (una acción por pulsación), fiel al `keydown` del prototipo original.

## Plan de implementación

1. **Migración Supabase.** Insertar la fila `tetris` en `games` (vía `apply_migration`). Nada cambia en el código todavía — el sitio sigue funcionando igual.
2. **Motor portado.** Crear `app/games/tetris/engine.ts` con `TetrisEngine` y los tipos (`EngineState`, `EngineSnapshot`, `EngineInput`), traduciendo 1:1 la lógica de `references/started-games/03-tetris/game.js` (tablero, piezas, rotación con wall-kicks, colisión, merge, clearLines, ghost, soft/hard drop, niveles, scoring). Módulo aislado, no importado aún desde ninguna página.
3. **Componente canvas.** Crear `app/games/tetris/tetris-canvas.tsx`: `forwardRef` con `TetrisCanvasHandle` (`restart`, `forceGameOver`), props `paused`/`onSnapshot`.
   - RAF y listeners a prueba de Strict Mode (mismo patrón que `asteroids-canvas.tsx`: cleanup cancela el RAF id y remueve los listeners exactos del efecto de montaje).
   - Teclado scopeado al componente (vive solo en `/jugar/tetris`, se registra/remueve en el mismo `useEffect`).
   - Canvas principal nítido con `devicePixelRatio` + `ResizeObserver`, más un canvas secundario interno para el preview de "siguiente pieza".
   - Tampoco se usa aún en ninguna ruta — build sigue sano.
4. **Integración en el reproductor.** Modificar `app/jugar/[id]/jugar-client.tsx`: si `id === "tetris"`, renderizar `TetrisCanvas` en vez del placeholder falso; HUD muestra Puntuación/**Líneas**/Nivel (sin "Vidas") leído del snapshot real; "PAUSA" → prop `paused`, "FIN" → `forceGameOver()`, "JUGAR DE NUEVO" → `restart()`, "GUARDAR PUNTUACIÓN" → `saveScore("tetris", name, score)`.
5. **Leaderboard real en detalle.** `app/juego/[id]/page.tsx`: si `id === "tetris"`, usar `getTopScores("tetris", 10)` en vez de `seededScores`; mensaje de estado vacío si no hay filas (mismo patrón que asteroides).
6. **Leaderboard real en salón.** `app/salon/salon-client.tsx`: la pestaña TETRIS usa `getTopScores` real con el mismo patrón de estado vacío que asteroides; el resto de pestañas no cambia.
7. **Verificación manual.** Con `npm run dev`, navegar `/biblioteca` → tarjeta "TETRIS" → `/juego/tetris` → `/jugar/tetris`. Confirmar: mover/rotar (con wall-kick)/soft drop/hard drop, despeje de líneas completas, aumento de velocidad de caída por nivel, preview de siguiente pieza, ghost piece visible, game over inmediato si la pieza nueva no puede spawnear (sin vidas de por medio), pausa congela el loop, "FIN" muestra el modal de game over con el score real, "JUGAR DE NUEVO" reinicia limpio, "GUARDAR PUNTUACIÓN" inserta en Supabase y la fila aparece en `/juego/tetris` y en la pestaña TETRIS de `/salon`, sin `requestAnimationFrame`/listeners colgados al salir de la página.

## Criterios de aceptación

- [x] La tabla `games` de Supabase incluye la fila `tetris` (`title`, `short`, `long`, `cat: "PUZZLE"`, `cover: "cover-tetro"`, `color: "cyan"`, `best: 24500`, `plays: "9.8K"`) y aparece en `/biblioteca` y `/juego/tetris` sin romper el resto de tarjetas; `caida` no cambia.
- [x] `app/games/tetris/engine.ts` porta el tablero 10×20, las 8 piezas (7 tetrominós + tuerca), rotación con wall-kicks, colisión, merge, `clearLines`, ghost piece, soft/hard drop y progresión de niveles, sin dependencias del DOM directo (`document`/`window`) fuera del componente.
- [x] `/jugar/tetris` reemplaza el placeholder falso: el HUD muestra Puntuación/**Líneas**/Nivel reales (sin campo "Vidas") reflejando el estado del motor, no el `setInterval` aleatorio.
- [x] Controles de teclado (`←` `→` `↓` `↑`/`X` `Espacio`) mueven, bajan, rotan y hacen hard drop de la pieza; ninguna de esas teclas scrollea la página.
- [x] Las líneas completas se despejan, suman puntos según `[0,100,300,500,800] * nivel`, y el tablero se recompacta hacia abajo.
- [x] El nivel sube cada 10 líneas acumuladas y la velocidad de caída aumenta (`dropInterval = max(100, 1000-(nivel-1)*90)`).
- [x] El ghost piece se ve en la posición de aterrizaje proyectada, sin interferir con la pieza activa.
- [x] El preview de "siguiente pieza" se actualiza cada vez que se spawnea una pieza nueva.
- [x] Si una pieza nueva no puede spawnear, el motor pasa directo a `gameover` (no existe estado intermedio de "vida perdida").
- [x] "PAUSA" congela el juego (el loop sigue vivo pero no avanza `dt`); "REANUDAR" continúa exactamente donde quedó.
- [x] "FIN" fuerza `gameover` con el score real y muestra el modal existente.
- [x] "JUGAR DE NUEVO" reinicia el motor a estado inicial (tablero vacío, score 0, líneas 0, nivel 1).
- [x] "GUARDAR PUNTUACIÓN" en `/jugar/tetris` inserta una fila real en `scores` (`game_id: "tetris"`) vía `saveScore`, y esa fila aparece en `/juego/tetris` y en la pestaña TETRIS de `/salon` tras refrescar.
- [x] Si `scores` no tiene filas para `tetris`, `/juego/tetris` y la pestaña TETRIS de `/salon` muestran el mensaje de estado vacío en vez de una lista/podio vacío o roto.
- [x] Al navegar fuera de `/jugar/tetris` no quedan `requestAnimationFrame` ni listeners de teclado corriendo en segundo plano.
- [x] Ningún otro `id` de juego (`caida` incluido) cambia de comportamiento.

## Decisiones tomadas y descartadas

- **Juego nuevo (`tetris`) en vez de reusar `caida`.** Motivo: mismo criterio que asteroides/`rocas` — `caida` queda intacto como placeholder falso, sin tocar otro juego fuera de alcance.
- **Reuso de `cover-tetro`** en vez de CSS nuevo. Motivo: ya existe un fondo temático de tetrominós (hoy usado por `caida`); evita duplicar estilos, mismo criterio que asteroides reusando `cover-rocas`.
- **Sin sistema de vidas: el HUD muestra "Líneas" en vez de "Vidas" para tetris.** Motivo: pedido explícito del usuario — el prototipo original no tiene vidas, game over es inmediato al no poder spawnear una pieza nueva; forzar un contador de vidas sería inventar una mecánica que no existe.
- **Leaderboard real desde el día uno (`getTopScores`/`saveScore`), nunca `seededScores`.** Motivo: decisión ya cerrada por la skill `/add-game` — generalización de spec 07, no se debate en este spec.
- **Patrón motor+canvas de asteroides seguido al pie de la letra** (mitigaciones de Strict Mode, teclado scopeado, canvas con DPR incorporadas directo en el paso 3 del plan). Motivo: decisión ya cerrada — spec 06 ya validó ese patrón, no se reinventa.
- **Se porta la pieza "N"/tuerca de acero**, aunque no es un tetrominó estándar. Motivo: ya está implementada y probada en el prototipo, no cuesta esfuerzo extra dejarla fuera (mismo criterio que el power-up de asteroides en spec 06).
- **Preview de "siguiente pieza" en un canvas secundario interno del componente**, sin exponerlo al padre. Motivo: mantiene el contrato `EngineSnapshot` simple (solo `score`/`lines`/`level`/`state`), igual de angosto que el de asteroides.
- **Wall-kicks simples `[0,-1,1,-2,2]`** en vez de las tablas SRS oficiales de Tetris. Motivo: fiel 1:1 al prototipo original; agregar SRS completo sería una mejora de mecánica no pedida.
- **Sin controles táctiles ni sonido.** Motivo: fuera de alcance, el prototipo tampoco los tiene; se decide en spec futuro si se pide.
- **Sin persistencia de `game.best`/`game.plays` recalculada.** Motivo: alcance ya cerrado en spec 07 — quedan estáticos.
