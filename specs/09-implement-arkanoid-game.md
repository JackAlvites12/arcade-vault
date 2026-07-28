# SPEC 09 — Juego Arkanoid

> **Estado:** Implementado
> **Depende de:** 06-asteroides, 07-leaderboard-y-tabla-juegos
> **Fecha:** 2026-07-28
> **Objetivo:** Portar el prototipo funcional de Arkanoid (`references/started-games/04-arkanoid/`) a un motor TypeScript con canvas, sprites y sonidos propios, reemplazando el placeholder `bloque-buster` por el juego real `arkanoid` con leaderboard conectado a Supabase.

## Alcance

**Incluye:**

- Migración SQL (`apply_migration`) que actualiza la fila existente `bloque-buster` en `games`: cambia `id` a `"arkanoid"`, `title` a "ARKANOID", ajusta `short`/`long`, `cat` sigue `"ARCADE"`, `color` pasa a `"yellow"`, `cover` sigue `"cover-bricks"`, `best`/`plays` conservan sus valores actuales (`28450` / `"12.4K"`) como punto de partida.
- Motor `app/games/arkanoid/engine.ts`: puerto 1:1 de `game.js` + `levels.js` — paleta, pelota, colisión AABB contra bloques, 5 niveles (`LEVELS`) con velocidad creciente, +10 puntos por bloque, estados `"playing" | "win" | "gameover"`, input `{ left, right, pointerX }`.
- Assets portados a `public/games/arkanoid/`: `spritesheet-breakout.png`, `sounds/ball-bounce.mp3`, `sounds/break-sound.mp3`. Módulo `app/games/arkanoid/spritesheet.ts`: puerto TS tipado de `assets/spritesheet.js` (`loadSpritesheet`/`drawSprite`/`drawFrame`).
- Componente `app/games/arkanoid/arkanoid-canvas.tsx`: sigue el patrón de `asteroids-canvas.tsx`/`tetris-canvas.tsx` (`forwardRef`, RAF+listeners a prueba de Strict Mode, teclado scopeado, resize con DPR). Suma `mousemove` sobre el contenedor para `pointerX`, y reproducción de sonidos (`Audio` + `cloneNode().play()`) en rebote de pared/paleta y rotura de bloque.
- `app/jugar/[id]/jugar-client.tsx`: nuevo `isArkanoid`, se suma a `isRealGame`, ref `arkanoidCanvasRef`, `handleArkanoidSnapshot`, rama de render, conectado a `restart`/`endGame`/`handleSave` igual que asteroides/tetris.
- `app/juego/[id]/page.tsx`: `isRealGame` suma `id === "arkanoid"` (ya usa `getTopScores`/`seededScores` condicional).
- `app/salon/page.tsx` + `app/salon/salon-client.tsx`: se agrega `getTopScores("arkanoid", 10)`, prop `arkanoidScores`, `REAL_GAME_IDS` suma `"arkanoid"`.

**Fuera de alcance (para specs futuros):**

- Controles táctiles/móviles.
- Menú de pausa con salto directo de nivel (función debug del prototipo original).
- Rebalanceo de dificultad/niveles distinto al original.
- Cambios a `asteroides`, `tetris`, o a cualquier otro juego con placeholder falso.
- Cambios a `references/started-games/04-arkanoid/` (solo lectura).
- Recalcular `best`/`plays` desde `scores` (quedan estáticos, igual que asteroides/tetris).

## Modelo de datos

No se introducen tipos nuevos en `app/data/games.ts` (la fila actualizada usa la interfaz `Game` ya existente). Los tipos nuevos son del motor y del componente:

```typescript
// app/games/arkanoid/engine.ts
export type EngineState = "playing" | "win" | "gameover";

export interface EngineSnapshot {
  score: number;
  lives: number;
  level: number;
  state: EngineState;
}

export interface EngineInput {
  left: boolean;
  right: boolean;
  pointerX: number | null; // posición del mouse en coordenadas del mundo (800x600); null si no hubo movimiento ese frame
}

// Internos del motor, no exportados: Paddle, Ball, Block (grilla 10x6), Explosion.
// LEVELS: 5 niveles, cada uno con su set de bloques y multiplicador de velocidad (portado 1:1 de levels.js).
```

```typescript
// app/games/arkanoid/arkanoid-canvas.tsx
export interface ArkanoidCanvasHandle {
  restart(): void;
  forceGameOver(): void;
}

export interface ArkanoidCanvasProps {
  paused: boolean;
  onSnapshot: (snapshot: EngineSnapshot) => void;
}
// Componente usa forwardRef<ArkanoidCanvasHandle, ArkanoidCanvasProps>
```

```typescript
// app/games/arkanoid/spritesheet.ts
export function loadSpritesheet(cb: () => void): void;
export function drawSprite(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, w: number, h: number): void;
export function drawFrame(ctx: CanvasRenderingContext2D, frame: SpriteFrame, x: number, y: number, w: number, h: number): void;
```

Actualización de la fila existente en `games` (vía `apply_migration`, no `INSERT` nuevo):

```sql
update games
set id = 'arkanoid',
    title = 'ARKANOID',
    short = 'Rompé hileras de bloques a puro rebote.',
    long = 'Controlá la paleta y hacé rebotar la pelota contra cinco niveles de bloques cada vez más rápidos. Un solo golpe por bloque, cero margen: perdé la pelota y perdés una vida.',
    color = 'yellow'
where id = 'bloque-buster';
-- cat sigue "ARCADE", cover sigue "cover-bricks", best/plays no cambian (28450 / "12.4K")
```

## Plan de implementación

1. **Migración de datos.** Aplicar (vía `apply_migration`) el `UPDATE` que cambia `id` de `bloque-buster` a `arkanoid`, ajusta `title`/`short`/`long`/`color`. Nada en el código cambia todavía — `/biblioteca` y `/juego/arkanoid` (antes `bloque-buster`) siguen mostrando el placeholder falso hasta el paso 5.
2. **Assets.** Copiar `assets/spritesheet-breakout.png` y `assets/sounds/{ball-bounce,break-sound}.mp3` de `references/started-games/04-arkanoid/` a `public/games/arkanoid/`. Sin código todavía.
3. **Motor portado.** Crear `app/games/arkanoid/engine.ts`: clases/estructuras `Paddle`, `Ball`, `Block`, `Explosion`, los 5 `LEVELS` (grillas + multiplicador de velocidad), y el `update(dt, input)`/`draw(ctx)`/`getSnapshot()` del loop — 1:1 con `game.js` + `levels.js`. Módulo aislado, no importado aún desde ninguna página.
4. **Spritesheet portado.** Crear `app/games/arkanoid/spritesheet.ts` con el puerto TS de `assets/spritesheet.js` (`loadSpritesheet`/`drawSprite`/`drawFrame`), apuntando a `/games/arkanoid/spritesheet-breakout.png`. Módulo aislado.
5. **Componente canvas.** Crear `app/games/arkanoid/arkanoid-canvas.tsx`: `forwardRef` con `ArkanoidCanvasHandle` (`restart`, `forceGameOver`), props `paused`/`onSnapshot`, siguiendo el mismo patrón de RAF/listeners/resize-DPR de `asteroids-canvas.tsx`/`tetris-canvas.tsx`. Suma listener de `mousemove` sobre el contenedor (mapea a coordenadas del mundo 800×600 para `pointerX`) y reproducción de `ball-bounce`/`break-sound` vía `Audio` + `cloneNode().play()`. Tampoco se usa aún en ninguna ruta — build sigue sano.
6. **Integración en el reproductor.** Modificar `app/jugar/[id]/jugar-client.tsx`: agregar `isArkanoid`, sumarlo a `isRealGame`, ref `arkanoidCanvasRef`, `handleArkanoidSnapshot`, rama de render de `<ArkanoidCanvas />`, conectar `restart()`/`forceGameOver()`/`saveScore("arkanoid", ...)` igual que asteroides/tetris.
7. **Detalle e integración en salón.** Modificar `app/juego/[id]/page.tsx` (`isRealGame` suma `"arkanoid"`) y `app/salon/page.tsx`/`app/salon/salon-client.tsx` (`getTopScores("arkanoid", 10)`, prop `arkanoidScores`, `REAL_GAME_IDS` suma `"arkanoid"`).
8. **Verificación manual.** Con `npm run dev`, navegar `/biblioteca` → tarjeta "ARKANOID" → `/juego/arkanoid` → `/jugar/arkanoid`. Confirmar: paleta se mueve con flechas y con mouse, pelota rebota en paredes/paleta/bloques con sonido, bloque se rompe y suma 10 puntos, al limpiar un nivel pasa al siguiente con velocidad mayor, al limpiar el nivel 5 el motor pasa a `"win"`, perder la pelota resta una vida y a 0 vidas pasa a `"gameover"`, "PAUSA" congela el juego, "FIN" fuerza game over con el score real, "GUARDAR PUNTUACIÓN" inserta en `scores` y aparece en `/juego/arkanoid` y en la pestaña ARKANOID de `/salon`, "JUGAR DE NUEVO" reinicia limpio, sin RAF/listeners colgados al salir y volver a entrar (consola sin errores).

## Criterios de aceptación

- [x] La fila `games` con `id: "arkanoid"` existe (migrada desde `bloque-buster`), con `title`/`short`/`long`/`cat`/`color`/`cover`/`best`/`plays` correctos, y aparece en `/biblioteca` y `/juego/arkanoid` sin romper el resto de tarjetas.
- [x] `app/games/arkanoid/engine.ts` porta paleta, pelota, bloques (grilla 10×6) y los 5 niveles con velocidad creciente, sin dependencias del DOM directo (`document`/`window`) fuera del componente.
- [x] `/jugar/arkanoid` reemplaza el placeholder falso: el HUD (Puntuación, Vidas, Nivel) refleja el estado real del motor.
- [x] La paleta se mueve con `←`/`→` y con el mouse (`pointerX`); ninguno de los dos rompe al otro.
- [x] Los bloques se rompen de a uno por colisión, suman +10 puntos cada uno, y se reproducen los sonidos de rebote/rotura.
- [x] Al limpiar todos los bloques de un nivel se avanza al siguiente con velocidad mayor; al limpiar el nivel 5 el motor pasa a `"win"`.
- [x] Perder la pelota resta una vida; a 0 vidas el motor pasa a `"gameover"`.
- [x] "PAUSA" congela el juego (no avanza `dt`); "REANUDAR" continúa donde quedó.
- [x] "FIN" fuerza `"gameover"` con el score real y muestra el modal existente.
- [x] "GUARDAR PUNTUACIÓN" en `/jugar/arkanoid` inserta una fila real en `scores` (`game_id: "arkanoid"`) que aparece en `/juego/arkanoid` y en la pestaña ARKANOID de `/salon`.
- [x] "JUGAR DE NUEVO" reinicia el motor a estado inicial (score 0, 3 vidas, nivel 1).
- [x] Al navegar fuera de `/jugar/arkanoid` no quedan `requestAnimationFrame` ni listeners de teclado/mouse corriendo en segundo plano.
- [x] El canvas mantiene proporción 4:3 y se ve nítido en pantallas de alta densidad (`devicePixelRatio`).
- [x] Ningún otro `id` de juego (`asteroides`, `tetris` incluidos) cambia de comportamiento.

## Decisiones

- **Reemplazar la fila `bloque-buster` en vez de crear una entrada nueva.** Motivo: pedido explícito — evita duplicar en el catálogo dos juegos de "romper bloques" (el placeholder falso y el real).
- **Cambiar el `id` de la fila a `"arkanoid"`** (no mantener `"bloque-buster"`). Motivo: pedido explícito — consistencia con `app/games/arkanoid/`, `/juego/arkanoid`, `/jugar/arkanoid`, igual que el resto de juegos reales.
- **Se reusa `cover: "cover-bricks"`** tal cual, sin CSS nuevo. Motivo: pedido explícito — ya existe y calza temáticamente.
- **Controles teclado + mouse simultáneos**, replicando el prototipo (mousemove mueve la paleta, flechas también). Motivo: pedido explícito — es la mecánica original, no una decisión de diseño nueva.
- **Se portan spritesheet y sonidos** (a diferencia de asteroides/tetris, que no tienen). Motivo: pedido explícito — ya están implementados y probados en el prototipo.
- **Sin menú de salto de nivel en pausa.** Motivo: pedido explícito — es una función de debug del prototipo, no pertenece a la experiencia final.
- **`EngineState` sin estado `"dead"` de respawn** (a diferencia de asteroides). Motivo: el original reposiciona la pelota al instante al perder una vida, sin invencibilidad temporal — portar 1:1 no agrega un estado que no existe en el prototipo.
- **Sin controles táctiles.** Motivo: fuera de alcance, el original tampoco los tiene.
- **`best`/`plays` heredan los valores actuales de `bloque-buster`** en vez de resetearse. Motivo: pedido implícito de continuidad — son datos de relleno igual antes y después, no hay razón para descartarlos.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Cambiar el `id` de `"bloque-buster"` a `"arkanoid"` podría dejar referencias colgantes si algo más en el código usa ese string literal. | Antes de aplicar la migración, grep de `"bloque-buster"` en el repo; `scores` no tiene filas para ese juego (nunca tuvo motor real), así que no hay filas huérfanas que migrar. |
| `INSERT` público sin restricción en `scores` permite spam de puntuaciones falsas (riesgo ya aceptado desde spec 07). | Mismo alcance ya aceptado — no se agrega validación server-side en este spec. |
