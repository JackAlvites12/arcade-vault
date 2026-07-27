# 06 — Juego Asteroides

> **Estado:** Implementado
> **Depende de:** ninguno (usa estructura ya existente de `app/data/games.ts`, `app/jugar/[id]/page.tsx`; no depende de Supabase)
> **Fecha:** 2026-07-26
> **Objetivo:** Portar el prototipo funcional de Asteroids (`references/started-games/02-asteroids/game.js`) a un motor TypeScript embebido en un componente cliente, y darle su propio juego jugable (`asteroides`) dentro de la biblioteca de Arcade Vault, con el HUD real de React conectado al estado del motor.

## Alcance

**Incluye:**

- Nueva entrada en `app/data/games.ts` (`GAMES`): `id: "asteroides"` con `title: "ASTEROIDES"`, `short`, `long`, `cat: "SHOOTER"`, `cover: "cover-rocas"`, `color: "cyan"`, `best`/`plays` de relleno. `rocas` queda intacto.
- Motor portado a TypeScript en `app/games/asteroides/engine.ts`: clases `Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle` (con `update`/`draw`/`dead`), funciones `spawnAsteroids`, `nextLevel`, `explode`, `killShip`, y el `update(dt)`/`draw(ctx)` del loop — 1:1 con `references/started-games/02-asteroids/game.js`, incluido el power-up de triple disparo. Mecánicas sin cambios: envolvimiento toroidal, split de asteroides por tamaño, invencibilidad parpadeante al reaparecer, partículas de explosión.
- Componente cliente `app/games/asteroides/asteroids-canvas.tsx`: `<canvas>` controlado por `ref`, loop `requestAnimationFrame`, listeners de teclado (`ArrowLeft/Right/Up`, `Space`) con `preventDefault` para no scrollear la página, canvas escalado con `devicePixelRatio` manteniendo proporción 800:600 dentro de `.crt-screen`. Expone `score`/`lives`/`level`/`state` (`playing|dead|gameover`) hacia el padre vía callback en cada frame. Acepta prop de pausa externa: si está pausado, no avanza `dt` (loop sigue vivo, `update` no se llama). Expone método/prop para forzar reinicio y para forzar game over (botón "FIN").
- `app/jugar/[id]/page.tsx`: cuando `id === "asteroides"`, renderiza `AsteroidsCanvas` en vez de los `div` falsos de `.game-arena`, y el HUD (Puntuación/Vidas/Nivel) lee del estado real que emite el motor en vez del `setInterval` aleatorio. "PAUSA" congela el motor, "FIN" fuerza game over con el score real, "JUGAR DE NUEVO" reinicializa el motor. Resto de `id` siguen con el comportamiento actual (placeholder falso).

**Fuera de alcance (para specs futuros):**

- Controles táctiles/móviles — solo teclado, igual que el original.
- Efectos de sonido.
- Persistencia real de score (Supabase) — "GUARDAR PUNTUACIÓN" sigue siendo solo UI, sin escribir a ningún lado.
- Cualquier cambio a `rocas` o a los otros 6 juegos con placeholder falso.
- Cambios a `references/started-games/02-asteroids/` (queda solo como referencia de lectura).
- Ajustes de dificultad/balance distintos a los del prototipo original.

## Modelo de datos

No se introducen tipos nuevos en `app/data/games.ts` (la nueva entrada usa la interfaz `Game` ya existente). Los tipos nuevos son del motor:

```typescript
// app/games/asteroides/engine.ts
export type EngineState = "playing" | "dead" | "gameover";

export interface EngineSnapshot {
  score: number;
  lives: number;
  level: number;
  state: EngineState;
}

// Clases internas del motor (no se exportan más que lo necesario para el componente):
// Bullet, Asteroid, PowerUp, Ship, Particle — cada una con update(dt), draw(ctx) y flag `dead`.
```

```typescript
// app/games/asteroides/asteroids-canvas.tsx
export interface AsteroidsCanvasHandle {
  restart(): void;
  forceGameOver(): void;
}

export interface AsteroidsCanvasProps {
  paused: boolean;
  onSnapshot: (snapshot: EngineSnapshot) => void;
}
// Componente usa forwardRef<AsteroidsCanvasHandle, AsteroidsCanvasProps>
```

Entrada nueva en `GAMES` (`app/data/games.ts`):

```typescript
{
  id: "asteroides",
  title: "ASTEROIDES",
  short: "Pulveriza rocas espaciales en gravedad cero.",
  long: "Tu nave triangular flota en el vacío absoluto. Rota, propulsa y dispara para partir asteroides en fragmentos cada vez más pequeños. Un power-up de disparo triple aparece cada tanto para darte ventaja.",
  cat: "SHOOTER",
  cover: "cover-rocas",
  color: "cyan",
  best: 38900,
  plays: "11.2K",
}
```

## Plan de implementación

1. **Dato del juego.** Agregar la entrada `asteroides` a `GAMES` en `app/data/games.ts`. La biblioteca y el detalle (`/juego/asteroides`) ya la muestran; `/jugar/asteroides` sigue con el placeholder falso hasta el paso 4.
2. **Motor portado.** Crear `app/games/asteroides/engine.ts` con las clases `Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle` y las funciones de estado (`spawnAsteroids`, `nextLevel`, `explode`, `killShip`, `update`, `draw`), traduciendo 1:1 la lógica de `references/started-games/02-asteroids/game.js` a TypeScript tipado. Módulo aislado, no se importa todavía desde ninguna página — no afecta nada en ejecución.
3. **Componente canvas.** Crear `app/games/asteroides/asteroids-canvas.tsx`: `forwardRef` con `AsteroidsCanvasHandle` (`restart`, `forceGameOver`), props `paused`/`onSnapshot`.
   - **RAF y listeners a prueba de Strict Mode:** el `useEffect` de montaje guarda el `requestAnimationFrame` id y las referencias exactas de las funciones `keydown`/`keyup` en variables locales del efecto; el cleanup cancela ese RAF id específico y remueve esos mismos listeners — así un doble montaje en dev (Strict Mode) no deja loops ni listeners duplicados corriendo.
   - **Teclado scopeado al componente, no global de la app:** los listeners de teclado se agregan en el mismo `useEffect` de montaje del componente (vive solo dentro de `/jugar/asteroides`) y se remueven en su cleanup — nunca se registran a nivel de layout/app, así no interfieren con atajos del navegador ni con otras rutas.
   - **Canvas nítido en pantallas de alta densidad:** tamaño real del canvas (atributos `width`/`height`) se calcula como `containerWidth * devicePixelRatio` (manteniendo proporción 4:3), el contexto se escala con `ctx.scale(dpr, dpr)`, y el tamaño CSS (`style.width`/`style.height`) se fija al tamaño lógico del contenedor. Se recalcula en un `ResizeObserver` sobre el contenedor para no quedar desplazado si cambia el viewport.
   - Loop `requestAnimationFrame` que llama al motor, canvas escalado dentro del contenedor 4:3, limpieza de RAF/listeners/`ResizeObserver` al desmontar. Tampoco se usa aún en ninguna ruta — build sigue sano.
4. **Integración en el reproductor.** Modificar `app/jugar/[id]/page.tsx`: si `id === "asteroides"`, renderizar `AsteroidsCanvas` dentro de `.crt-screen` en vez de `.game-arena`, reemplazar el `setInterval` falso por el `onSnapshot` del motor para `score`/`lives`/`level`/`state`, conectar "PAUSA" a la prop `paused`, "FIN" a `forceGameOver()`, "JUGAR DE NUEVO" a `restart()`. El resto de `id` no cambia.
5. **Verificación manual.** Con `npm run dev`, navegar `/biblioteca` → tarjeta "ASTEROIDES" → `/juego/asteroides` → `/jugar/asteroides`. Confirmar: movimiento/rotación/propulsión/disparo, split de asteroides, subida de nivel al limpiar el campo, pérdida de vida con parpadeo de invencibilidad, recogida del power-up de disparo triple, pausa congela el juego, "FIN" muestra el modal de game over con el score real, "JUGAR DE NUEVO" reinicia limpio, "SALIR" no deja el loop corriendo en background (revisar consola sin errores al navegar fuera y volver a entrar).

## Criterios de aceptación

- [x] `GAMES` incluye la entrada `asteroides` (título, short, long, cat, cover, color, best, plays) y aparece en `/biblioteca` y `/juego/asteroides` sin romper el resto de tarjetas.
- [x] `app/games/asteroides/engine.ts` porta las 5 clases (`Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle`) y toda la lógica de estado (spawn, split, niveles, invencibilidad, power-up) sin dependencias del DOM directo (`document`/`window` fuera del componente).
- [x] `/jugar/asteroides` reemplaza el placeholder falso: el HUD (Puntuación, Vidas, Nivel) refleja el estado real del motor, no el `setInterval` aleatorio.
- [x] Controles de teclado (`←` `→` `↑` `Espacio`) mueven la nave y disparan; las flechas/espacio no scrollean la página.
- [x] Los asteroides grandes se parten en medianos y estos en pequeños al impactar una bala; los pequeños no se parten.
- [x] Al perder una vida hay invencibilidad temporal con parpadeo; a 0 vidas el motor pasa a `gameover`.
- [x] El power-up de disparo triple aparece, se recoge, y expira tras su duración.
- [x] "PAUSA" congela el juego (no avanza `dt`); "REANUDAR" continúa exactamente donde quedó.
- [x] "FIN" fuerza `gameover` con el score real y muestra el modal existente.
- [x] "JUGAR DE NUEVO" reinicia el motor a estado inicial (score 0, 3 vidas, nivel 1).
- [x] Al navegar fuera de `/jugar/asteroides` no quedan `requestAnimationFrame` ni listeners de teclado corriendo en segundo plano.
- [x] El canvas se ve nítido en pantallas de alta densidad (`devicePixelRatio`) y mantiene proporción 4:3 dentro de `.crt-screen`.
- [x] Ningún otro `id` de juego (`rocas` incluido) cambia de comportamiento.

## Decisiones tomadas y descartadas

- **Juego nuevo (`asteroides`) en vez de reusar `rocas`.** Motivo: pedido explícito del usuario — `rocas` queda intacto como placeholder falso, sin tocar otro juego fuera de alcance.
- **Se porta el power-up de disparo triple**, aunque no está documentado en el README/CLAUDE.md original. Motivo: pedido explícito — ya está implementado y probado en el prototipo, no cuesta esfuerzo extra dejarlo fuera.
- **HUD de React se mantiene**, el canvas solo dibuja el campo de juego (nave/asteroides/balas/partículas). Motivo: pedido explícito — consistencia visual con el resto de Arcade Vault en vez del HUD dibujado en canvas del original.
- **Canvas escalado con `devicePixelRatio` y CSS** en vez de tamaño fijo 800×600. Motivo: pedido explícito — la proporción 800:600 ya es 4:3, coincide exacto con `.crt-screen`, permite verse nítido y responsive sin distorsión.
- **Pausa implementada como congelamiento de `dt`** (no existía en el original). Motivo: pedido explícito — el loop sigue vivo pero no llama `update`, evita reescribir el ciclo de animación.
- **Sin persistencia real de score.** Motivo: alcance ya cerrado en spec 04 — la migración de scores a Supabase es un spec aparte.
- **Reuso de `cover-rocas` como arte de portada** para `asteroides` en vez de CSS nuevo. Motivo: pedido explícito — ya existe un fondo temático de asteroides, evita duplicar estilos.
- **Sin controles táctiles ni sonido.** Motivo: fuera de alcance, el original tampoco los tiene; se decide en spec futuro si se pide.
- **Mitigaciones de riesgo incorporadas directo en el paso 3 del plan** (cleanup de Strict Mode, teclado scopeado, canvas con DPR) en vez de quedar solo como tabla de riesgos aparte. Motivo: pedido explícito del usuario.
