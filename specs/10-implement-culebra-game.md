# 10 — Implementar el juego Culebra

> **Estado:** Implementado
> **Depende de:** [06-asteroides](06-asteroides.md) (patrón motor+canvas), [07-leaderboard-y-tabla-juegos](07-leaderboard-y-tabla-juegos.md) (infraestructura Supabase `games`/`scores`, `app/data/db.ts`)
> **Fecha:** 2026-07-28
> **Objetivo:** Agregar el juego Culebra (Snake clásico), construido desde cero con motor TypeScript real, componente canvas propio, sprites de fruta del asset de referencia (`references/source-assets/snake-assets`), integración en el reproductor, y leaderboard real de Supabase desde el día uno.

## Alcance

**Incluye:**

- Fila nueva en la tabla `games` de Supabase: `id: "culebra"`, `title: "CULEBRA"`, `short: "Guiá a la víbora por el tablero y devorá frutas sin morder tu propia cola."`, `long: "Cada fruta que comés te alarga un segmento y suma puntos, pero el tablero no perdona: chocar contra el borde o contra tu propia cola termina la partida al instante. Cuanto más larga la víbora, menos margen de error te queda."`, `cat: "ARCADE"`, `color: "green"`, `cover: "cover-snake"`, `best: 15400`, `plays: "6.8K"`. `serpentina` queda intacta como placeholder, sin tocar.
- Motor en `app/games/culebra/engine.ts`: grid fijo (celdas), serpiente como lista de segmentos, una dirección activa, una fruta en el tablero. `update(dt)` avanza por tick fijo (movimiento discreto por celda, no física continua). Colisión contra borde y contra el propio cuerpo → `gameover`. Comer fruta: crece 1 segmento, suma puntos fijos, reubica la fruta en una celda libre. `EngineSnapshot` con `score`, `lives` (fijo en `1`), `level` (fijo en `1`), `state` (`"playing" | "gameover"`).
- Componente cliente `app/games/culebra/culebra-canvas.tsx`: `forwardRef` con `restart()`/`forceGameOver()`, props `paused`/`onSnapshot`. Dibuja tablero y serpiente con formas vectoriales simples (igual que asteroides dibuja nave/asteroides sin sprites). El tablero dibuja un borde bien visible (no solo la grilla interna tenue) marcando el límite jugable exacto, para que quede claro dónde choca la serpiente contra el borde. Carga `fruits.png` como `Image` y dibuja la fruta con `drawImage` usando las coordenadas de `SPRITE_ATLAS.fruits.apple`. Loop `requestAnimationFrame` que acumula tiempo y avanza el juego a un tick rate fijo (no cada frame). Teclado (flechas/WASD) scopeado al componente, canvas con `devicePixelRatio` dentro de `.crt-screen`, cleanup a prueba de Strict Mode — mismo patrón que `asteroids-canvas.tsx`.
- Copiar `fruits.png` a `public/snake-assets/fruits.png` (Next.js no sirve `references/` al navegador). El atlas de coordenadas (`sprites.js`) se traduce a una constante TypeScript dentro de `engine.ts`, no se importa el `.js` original (usa `window.SPRITE_ATLAS`, no es un módulo ES).
- `app/jugar/[id]/jugar-client.tsx`: cuando `game.id === "culebra"`, renderiza `CulebraCanvas` en vez del placeholder falso; HUD (Puntuación/Vidas/Nivel/Pausa) sin cambios de layout, leyendo `lives`/`level` fijos en `1` del snapshot.
- `app/juego/[id]/page.tsx` y `app/salon/salon-client.tsx`: agregar `culebra` a los juegos con leaderboard real (`getTopScores("culebra", 10)` / `saveScore("culebra", ...)`), mismo mensaje de estado vacío que ya existe para `asteroides` si no hay scores.

**Fuera de alcance:**

- Controles táctiles/mouse — solo teclado.
- Efectos de sonido.
- Frutas variadas con distinto puntaje, power-ups, niveles o velocidad progresiva — snake clásico minimalista.
- Envolvimiento toroidal — muere al chocar contra el borde.
- Cambios a `serpentina` o a cualquier otro juego con placeholder falso.
- Cambios a `references/source-assets/snake-assets` (queda como referencia de lectura; se copia a `public/`, no se modifica el original).

## Modelo de datos

Fila nueva en `games` (misma tabla de spec 07, sin cambios de esquema):

```sql
insert into games (id, title, short, long, cat, cover, color, best, plays) values (
  'culebra',
  'CULEBRA',
  'Guiá a la víbora por el tablero y devorá frutas sin morder tu propia cola.',
  'Cada fruta que comés te alarga un segmento y suma puntos, pero el tablero no perdona: chocar contra el borde o contra tu propia cola termina la partida al instante. Cuanto más larga la víbora, menos margen de error te queda.',
  'ARCADE',
  'cover-snake',
  'green',
  15400,
  '6.8K'
);
```

Tipos nuevos del motor:

```typescript
// app/games/culebra/engine.ts
export type EngineState = "playing" | "gameover";

export interface EngineSnapshot {
  score: number;
  lives: number; // siempre 1, HUD no distingue este juego
  level: number; // siempre 1, HUD no distingue este juego
  state: EngineState;
}

export interface EngineInput {
  direction: "up" | "down" | "left" | "right" | null;
}

interface Cell {
  x: number;
  y: number;
}
```

Tipos del componente:

```typescript
// app/games/culebra/culebra-canvas.tsx
export interface CulebraCanvasHandle {
  restart(): void;
  forceGameOver(): void;
}

export interface CulebraCanvasProps {
  paused: boolean;
  onSnapshot: (snapshot: EngineSnapshot) => void;
}
```

Coordenadas del sprite usado (traducidas desde `references/source-assets/snake-assets/sprites.js`, que no es un módulo ES importable):

```typescript
// app/games/culebra/engine.ts
export const FRUIT_SPRITE = { x: 2786, y: 136, w: 110, h: 160 } as const; // apple
```

No se introducen tipos nuevos en `app/data/games.ts` (la fila nueva reusa `Game`; el leaderboard reusa `ScoreRow`).

## Plan de implementación

1. **Copiar assets.** Copiar `fruits.png` a `public/snake-assets/fruits.png`. Paso aislado, no afecta nada en ejecución.
2. **Migración Supabase.** Aplicar (vía `apply_migration` del MCP) el `insert` que agrega la fila `culebra` a `games`. El sitio sigue funcionando igual; nada en el código la consume todavía.
3. **Motor.** Crear `app/games/culebra/engine.ts`: grid, lista de segmentos, dirección activa, fruta, `update(dt)` con tick fijo, detección de colisión contra borde/cuerpo propio, crecimiento y scoring al comer, `getSnapshot()`/`restart()`/`forceGameOver()`. Módulo aislado, no importado desde ninguna página — build sigue sano.
4. **Componente canvas.** Crear `app/games/culebra/culebra-canvas.tsx`: `forwardRef` con `CulebraCanvasHandle`, props `paused`/`onSnapshot`, carga de `fruits.png` vía `Image`, dibujo de tablero/serpiente/fruta (`drawImage` con `FRUIT_SPRITE`), loop `requestAnimationFrame` con acumulador de tiempo para tick fijo, teclado scopeado, cleanup a prueba de Strict Mode, canvas con `devicePixelRatio`. Tampoco se usa aún en ninguna ruta.
5. **Integración en el reproductor.** Modificar `app/jugar/[id]/jugar-client.tsx`: si `game.id === "culebra"`, renderizar `CulebraCanvas` dentro de `.crt-screen` en vez del placeholder falso; conectar "PAUSA" a `paused`, "FIN" a `forceGameOver()`, "JUGAR DE NUEVO" a `restart()`, HUD a los campos del snapshot (`lives`/`level` fijos en `1`). "GUARDAR PUNTUACIÓN" llama `saveScore("culebra", name, score)` antes de `setSaved(true)`, mismo patrón que `asteroides`. Resto de `id` no cambia.
6. **Leaderboard real.** En `app/juego/[id]/page.tsx` y `app/salon/salon-client.tsx`, agregar `"culebra"` al criterio que hoy distingue `asteroides` (usa `getTopScores("culebra", 10)` en vez de `seededScores`), con el mismo mensaje de estado vacío si no hay filas. Resto de juegos sigue con `seededScores`.
7. **Verificación manual.** Con `npm run dev`: `/biblioteca` → tarjeta "CULEBRA" → `/juego/culebra` (leaderboard vacío inicial) → `/jugar/culebra`. Confirmar: movimiento por flechas/WASD, la serpiente crece al comer la fruta (sprite de manzana visible), choque contra borde y contra el propio cuerpo terminan la partida, "PAUSA" congela el tick, "FIN" muestra el modal con score real, "JUGAR DE NUEVO" reinicia limpio, "GUARDAR PUNTUACIÓN" inserta en `scores` y la fila aparece en `/juego/culebra` y en la pestaña CULEBRA de `/salon`, sin `requestAnimationFrame` ni listeners colgados al salir de `/jugar/culebra`.

## Criterios de aceptación

- [x] `games` incluye la fila `culebra` (id/title/short/long/cat/color/cover/best/plays) y aparece en `/biblioteca` y `/juego/culebra` sin romper el resto de tarjetas.
- [x] `app/games/culebra/engine.ts` implementa movimiento en grid, colisión contra borde, colisión contra el propio cuerpo, crecimiento y scoring al comer, sin dependencias del DOM directo (`document`/`window`) fuera del componente.
- [x] `/jugar/culebra` reemplaza el placeholder falso: el HUD (Puntuación, Vidas fijo en 1, Nivel fijo en 1) refleja el estado real del motor.
- [x] Controles de teclado (flechas/WASD) cambian la dirección de movimiento; no scrollean la página.
- [x] Al chocar contra el borde del tablero o contra el propio cuerpo, el motor pasa a `gameover` inmediatamente (sin envolvimiento toroidal).
- [x] Al comer la fruta, la serpiente crece un segmento, el score sube en la cantidad fija definida, y la fruta se reubica en una celda libre.
- [x] La fruta se dibuja con el sprite `apple` de `public/snake-assets/fruits.png` vía `drawImage`, no como forma vectorial.
- [x] "PAUSA" congela el tick (no avanza el juego); "REANUDAR" continúa exactamente donde quedó.
- [x] "FIN" fuerza `gameover` con el score real y muestra el modal existente.
- [x] "JUGAR DE NUEVO" reinicia el motor a estado inicial (score 0, serpiente en tamaño inicial).
- [x] El leaderboard de `culebra` usa `getTopScores`/`saveScore` reales (Supabase) en `/juego/culebra`, `/salon` y "GUARDAR PUNTUACIÓN" — no `seededScores`.
- [x] Si `scores` no tiene filas para `culebra`, `/juego/culebra` y la pestaña CULEBRA de `/salon` muestran el mensaje de estado vacío existente, no una lista/podio roto.
- [x] Al navegar fuera de `/jugar/culebra` no quedan `requestAnimationFrame` ni listeners de teclado corriendo en segundo plano.
- [x] El canvas se ve nítido en pantallas de alta densidad (`devicePixelRatio`) dentro de `.crt-screen`.
- [x] El borde del tablero se ve claramente delimitado (contraste marcado frente a la grilla interna), sin ambigüedad sobre dónde termina el área jugable.
- [x] Ningún otro `id` de juego (`serpentina` incluido) cambia de comportamiento.

## Decisiones tomadas y descartadas

- **Se sigue al pie de la letra el patrón motor+canvas de `06-asteroides`** (motor TypeScript aislado sin DOM directo, componente `forwardRef` con `restart`/`forceGameOver`, RAF con cleanup a prueba de Strict Mode, teclado scopeado, canvas con `devicePixelRatio`). Motivo: patrón ya probado dos veces (specs 06 y el resto de juegos con motor real), evita re-derivar decisiones de arquitectura ya cerradas.
- **Leaderboard real desde el día uno (Supabase, vía `app/data/db.ts`), nunca `seededScores`.** Motivo: decisión ya cerrada por spec 07 para todo juego con motor real nuevo — no se debate en este spec.
- **Juego nuevo (`culebra`) en vez de mutar `serpentina`.** Motivo: mismo criterio que asteroides vs. rocas — `serpentina` queda intacta como placeholder, sin tocar otro juego fuera de alcance.
- **Se reusa la clase `.cover-snake` ya existente** en vez de CSS nuevo. Motivo: pedido explícito — mismo criterio que asteroides reusando `cover-rocas`, ya existe un fondo temático de serpiente.
- **Muerte al chocar contra el borde, sin envolvimiento toroidal.** Motivo: pedido explícito — snake clásico, distinto del criterio de asteroides.
- **HUD de Vidas/Nivel fijos en `1`, sin ocultar campos.** Motivo: pedido explícito — evita lógica condicional de layout en `jugar-client.tsx` por juego.
- **Un solo tipo de fruta (`apple`) del atlas, sin variedad de puntajes.** Motivo: pedido explícito — snake clásico minimalista, igual de simple que asteroides sin power-ups extra no pedidos.
- **Sprite de fruta vía `drawImage`, resto del juego (serpiente/tablero) vectorial.** Motivo: pedido explícito — usar el asset de referencia solo donde aporta variedad visual real, sin sobrecargar de sprites lo que ya funciona bien vectorial (consistencia con asteroides).
- **`fruits.png` se copia a `public/snake-assets/`** en vez de servir desde `references/`. Motivo: necesidad técnica — Next.js no expone `references/` al navegador; el atlas de coordenadas (`sprites.js`) se traduce a una constante TypeScript porque el original usa `window.SPRITE_ATLAS`, no es un módulo ES importable.
- **Sin controles táctiles ni sonido.** Motivo: fuera de alcance, mismo criterio que asteroides.
- **`game.best`/`game.plays` de `culebra` quedan estáticos**, no se recalculan desde `scores`. Motivo: mismo criterio ya cerrado en spec 07 para asteroides.
