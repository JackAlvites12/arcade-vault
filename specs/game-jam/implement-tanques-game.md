# SPEC — Juego TANQUES

> **Estado:** Aprobado
> **Depende de:** 06-asteroides (patrón motor+canvas), 07-leaderboard-y-tabla-juegos (Supabase)
> **Fecha:** 2026-08-01
> **Objetivo:** Añadir `tanques`, el primer juego con motor real de la categoría VERSUS: un duelo por rondas contra un tanque CPU en un laberinto generado con semilla determinista, donde las balas rebotan en las paredes y matan a quien las disparó.

## Alcance

**Incluye:**

- INSERT de una fila nueva en `games` (Supabase, vía `apply_migration`): `id: "tanques"`, `title: "TANQUES"`, `short`, `long`, `cat: "VERSUS"`, `cover: "cover-tanques"`, `color: "magenta"`, `best: 18600`, `plays: "4.2K"`. `duelo-pixel` (placeholder de Pong) queda intacto.
- Clase CSS nueva `.cover-tanques` en `app/globals.css`, siguiendo el patrón decorativo puro de `.cover-duelo`/`.cover-rana`: fondo oscuro, rejilla de muros con `repeating-linear-gradient`, dos siluetas rectangulares (magenta y cyan) enfrentadas y una bala amarilla con `drop-shadow` neón.
- Motor `app/games/tanques/engine.ts`: arena de rejilla 21×15 celdas (mundo 840×600, celda de 40 px) con tres tipos de celda (`empty`, `brick` destructible, `steel` indestructible), tanque del jugador y tanque CPU, movimiento en 4 direcciones con orientación (no hay marcha atrás: girar reorienta el cañón), disparo con **una sola bala propia en vuelo**, rebote de bala hasta 2 impactos contra `steel` y destrucción de `brick` al primer impacto, colisión bala-tanque (incluida la bala propia después de rebotar), sistema de rondas, vidas y puntuación. Incluye las constantes de mitigación (`MAX_BULLET_LIFE`, `MAX_DT`, `BULLET_SUBSTEP`, `MAZE_ATTEMPTS`, `AI_DIR_HOLD`, `AI_STUCK_TIMEOUT`) y la función pura `selfCheck()` que las verifica — ver la sección "Riesgos".
- Generación de laberinto **determinista por número de ronda** (`mulberry32(seed = ronda)`): mismo mapa para todos los jugadores en la ronda N, para que el leaderboard mida habilidad y no suerte de mapa. Borde exterior siempre `steel`; celdas interiores sorteadas con densidad fija; las dos celdas de aparición y sus ortogonales siempre `empty`.
- IA de la CPU en el mismo `engine.ts`: perseguir en línea recta hacia el eje del jugador con desvío aleatorio al chocar contra un muro; disparar cuando el jugador está alineado en fila o columna y no hay `steel` entre medias. Cadencia y velocidad escalan por ronda (`fireCooldown = max(0.35, 1.2 - ronda*0.09)`, `speed = 90 + ronda*6`). Sin BFS ni pathfinding.
- Componente cliente `app/games/tanques/tanques-canvas.tsx`: `<canvas>` con loop `requestAnimationFrame`, teclado (`←`/`→`/`↑`/`↓` mover-orientar, `Espacio`/`KeyZ` disparar) con `preventDefault`, `forwardRef` con `restart()`/`forceGameOver()`, resize DPR-aware con `ResizeObserver`, efecto único de montaje a prueba de Strict Mode, reporte de `EngineSnapshot` vía `onSnapshot`.
- `app/jugar/[id]/jugar-client.tsx`: `isTanques`, suma a `isRealGame`, `tanquesCanvasRef`, `handleTanquesSnapshot`, rama de render; HUD muestra Puntuación / Vidas / Nivel (= ronda); "GUARDAR PUNTUACIÓN" llama `saveScore("tanques", name, score)`.
- `app/juego/[id]/page.tsx`: `isRealGame` suma `"tanques"` → `getTopScores("tanques", 10)` con el mensaje de estado vacío ya existente.
- `app/salon/page.tsx` + `app/salon/salon-client.tsx`: `getTopScores("tanques", 10)`, prop `tanquesScores`, `REAL_GAME_IDS` suma `"tanques"`.

**Fuera de alcance (para specs futuros):**

- Multijugador local a dos teclados y, sobre todo, multijugador remoto: la CPU es el único rival.
- Controles táctiles/móviles.
- Efectos de sonido.
- Power-ups (escudo, bala rápida, doble disparo) y variantes de tanque.
- Muros de agua/hielo/bosque de Battle City: solo `empty`/`brick`/`steel`.
- Pathfinding real (A*/BFS) para la CPU.
- Cambios a `duelo-pixel` ni a ningún otro juego con placeholder.
- Recalcular `best`/`plays` desde `scores`.
- Autenticación real vinculada a `player_name`.

## Modelo de datos

Nueva fila en `games` (Supabase, vía `apply_migration`):

```sql
insert into games (id, title, short, long, cat, cover, color, best, plays) values (
  'tanques',
  'TANQUES',
  'Duelo blindado en un laberinto donde las balas rebotan.',
  'Un tanque contra otro en una arena de muros de ladrillo y acero. Los ladrillos se deshacen a cañonazos, el acero devuelve la bala: la tuya también puede matarte si calculás mal el rebote. Ganá rondas contra una CPU que apunta cada vez mejor.',
  'VERSUS', 'cover-tanques', 'magenta', 18600, '4.2K'
);
```

Tipos nuevos del motor:

```typescript
// app/games/tanques/engine.ts
export type EngineState = "playing" | "roundover" | "gameover";

export interface EngineSnapshot {
  score: number;
  lives: number;
  level: number; // número de ronda
  state: EngineState;
}

export interface EngineInput {
  up: boolean;    // held: orienta + avanza
  down: boolean;  // held
  left: boolean;  // held
  right: boolean; // held
  fire: boolean;  // edge-triggered (una bala por pulsación)
}

export class TanquesEngine {
  static readonly COLS = 21;
  static readonly ROWS = 15;
  static readonly CELL = 40;   // mundo 840x600
  static readonly MAX_BOUNCES = 2;

  // Constantes de mitigación de riesgos (ver sección "Riesgos").
  // Cada una existe para acotar un fallo concreto, no para afinar el juego.
  static readonly MAX_BULLET_LIFE = 4;    // s; la bala expira aunque no impacte nada
  static readonly MAX_DT = 1 / 30;        // s; techo de paso, evita tunneling tras un frame largo
  static readonly BULLET_SUBSTEP = 8;     // px; avance máximo por subpaso de colisión
  static readonly MAZE_ATTEMPTS = 8;      // re-sorteos con seed+1 antes de la plantilla fija
  static readonly AI_DIR_HOLD = 0.4;      // s; mínimo que la CPU mantiene una dirección nueva
  static readonly AI_STUCK_TIMEOUT = 1.5; // s sin avanzar antes de forzar cambio de dirección

  constructor();
  restart(): void;
  forceGameOver(): void;
  update(dt: number, input: EngineInput): void;
  draw(ctx: CanvasRenderingContext2D): void;
  getSnapshot(): EngineSnapshot;
  // internos no exportados: Cell, Tank, Bullet, grid, round, score, lives,
  //   roundTimer (pausa de 1.2 s entre rondas), rng determinista por ronda
}

/** Autocomprobación de las mitigaciones. Devuelve los fallos; vacío = todo bien.
 *  Pura y sin DOM: la llama el canvas solo en desarrollo. */
export function selfCheck(): string[];
```

```typescript
// app/games/tanques/tanques-canvas.tsx
export interface TanquesCanvasHandle {
  restart(): void;
  forceGameOver(): void;
}

export interface TanquesCanvasProps {
  paused: boolean;
  onSnapshot: (snapshot: EngineSnapshot) => void;
}
// forwardRef<TanquesCanvasHandle, TanquesCanvasProps>
```

Reglas de puntuación y progresión (fijas, no configurables):

| Evento | Efecto |
|---|---|
| Destruir un `brick` | +5 |
| Destruir el tanque CPU | +100 × ronda |
| Ronda ganada sin recibir impacto | +50 extra |
| Tu tanque destruido (por la CPU o por tu propia bala rebotada) | −1 vida, reinicia la ronda actual con el mismo mapa |
| Ronda ganada | `round++`, mapa nuevo determinista, CPU más rápida y con menos cooldown |
| Vidas a 0 | `state = "gameover"` |

Vidas iniciales: 3. Ronda inicial: 1.

## Plan de implementación

1. **Migración Supabase.** Insertar la fila `tanques` en `games` vía `apply_migration`. Nada de código todavía: `/biblioteca` muestra la tarjeta nueva con el placeholder genérico y el sitio sigue sano.
2. **Portada CSS.** Añadir `.cover-tanques` (y su `::after`) al bloque de covers de `app/globals.css`. Verificable de inmediato en `/biblioteca` y `/juego/tanques`.
3. **Motor aislado.** Crear `app/games/tanques/engine.ts`: tipos (`EngineState`, `EngineSnapshot`, `EngineInput`), generación determinista del laberinto, movimiento y colisión tanque-muro sobre la rejilla, bala con rebote y contador de rebotes, destrucción de `brick`, colisión bala-tanque, rondas/vidas/score, IA de la CPU. Módulo puro, sin `document`/`window`, no importado aún desde ninguna ruta. En este mismo paso entran las cuatro mitigaciones, porque cada una es una línea del motor y ninguna se puede añadir después sin reescribir su función:
   - `update()` arranca con `dt = Math.min(dt, MAX_DT)` y avanza la bala en subpasos de `BULLET_SUBSTEP` px como máximo, comprobando colisión en cada subpaso.
   - La bala lleva `life` acumulada y muere al superar `MAX_BULLET_LIFE`, independientemente de `MAX_BOUNCES`.
   - El generador de laberinto valida por flood fill desde la celda de aparición del jugador que la celda de la CPU es alcanzable y que toda celda `empty` pertenece a esa región; si falla, re-sortea con `seed + 1` hasta `MAZE_ATTEMPTS` veces y, agotados, usa una plantilla fija embebida en el módulo.
   - La CPU guarda `dirHold` y `noProgress`: al elegir dirección nueva la mantiene `AI_DIR_HOLD` segundos, y si lleva `AI_STUCK_TIMEOUT` segundos sin cambiar de celda, fuerza un cambio a una ortogonal libre.
4. **Autocomprobación del motor.** El repo no tiene runner de tests ni dependencia de testing, y este spec no añade ninguna. En su lugar, `engine.ts` exporta `selfCheck(): string[]` — función pura que devuelve la lista de fallos (vacía = todo bien) y que `tanques-canvas.tsx` invoca en el efecto de montaje **solo** bajo `process.env.NODE_ENV === "development"`, volcando cada fallo con `console.error`. Cinco comprobaciones, una por mitigación:
   1. Rondas 1 a 50: el laberinto es conexo por flood fill y las celdas de aparición y sus ortogonales están libres.
   2. Misma ronda generada dos veces produce rejillas idénticas.
   3. En un mapa sin muros, la bala deja de existir antes de `MAX_BULLET_LIFE + 1` s de simulación.
   4. Con `update(1, ...)` (un frame de 1 s, peor caso) la bala no acaba dentro de una celda `brick`/`steel` ni fuera de la arena.
   5. Con la CPU empujando contra un muro, su celda cambia antes de `AI_STUCK_TIMEOUT + 1` s.

   Sin esto las mitigaciones son texto: los cuatro riesgos son justo los que no se ven jugando cinco minutos.
5. **Componente canvas.** Crear `app/games/tanques/tanques-canvas.tsx` copiando el patrón de `asteroids-canvas.tsx`: `forwardRef` con `restart()`/`forceGameOver()`, props `paused`/`onSnapshot`, RAF y listeners registrados y limpiados en un único `useEffect` de montaje a prueba de Strict Mode, teclado scopeado al componente, canvas nítido con `devicePixelRatio` + `ResizeObserver`, y la llamada a `selfCheck()` en desarrollo. El `dt` sale de la diferencia de `timestamp` del RAF, así que una pestaña en segundo plano devuelve un `dt` enorme al volver: el clamp vive en el motor, no aquí, para que la autocomprobación lo cubra. Aún sin usarse en ninguna ruta.
6. **Integración en el reproductor.** Modificar `app/jugar/[id]/jugar-client.tsx`: `isTanques`, suma a `isRealGame`, `tanquesCanvasRef`, `handleTanquesSnapshot`, rama de render; conectar "PAUSA" → prop `paused`, "FIN" → `forceGameOver()`, "JUGAR DE NUEVO" → `restart()`, "GUARDAR PUNTUACIÓN" → `saveScore("tanques", ...)`.
7. **Leaderboard real en detalle.** `app/juego/[id]/page.tsx`: `isRealGame` suma `"tanques"`.
8. **Leaderboard real en salón.** `app/salon/page.tsx` + `app/salon/salon-client.tsx`: `getTopScores("tanques", 10)`, prop `tanquesScores`, `REAL_GAME_IDS` suma `"tanques"`.
9. **Verificación manual.** Con `npm run dev`: `/biblioteca` → tarjeta TANQUES → `/juego/tanques` → `/jugar/tanques`. Comprobar movimiento en 4 direcciones, disparo limitado a una bala en vuelo, rebote contra acero, destrucción de ladrillo, muerte por bala propia rebotada, victoria de ronda con mapa nuevo, pérdida de vida reiniciando la ronda, game over a 0 vidas, pausa, "FIN", "JUGAR DE NUEVO", guardado de puntuación visible en `/juego/tanques` y en la pestaña TANQUES de `/salon`, y ausencia de RAF/listeners colgados al salir de la página. Añadido a esta ronda: la consola no muestra ningún fallo de `selfCheck()`; cambiar de pestaña 30 s y volver no teletransporta la bala a través de un muro; y jugar hasta la ronda 5 sin que la CPU se quede clavada contra un muro más de dos segundos.

## Criterios de aceptación

- [ ] La tabla `games` incluye la fila `tanques` (`cat: "VERSUS"`, `cover: "cover-tanques"`, `color: "magenta"`) y la tarjeta aparece en `/biblioteca` y en `/juego/tanques` sin romper el resto; `duelo-pixel` no cambia.
- [ ] `.cover-tanques` existe en `app/globals.css` y la portada se ve en la tarjeta y en el detalle sin recuadros vacíos.
- [ ] `app/games/tanques/engine.ts` no referencia `document` ni `window`.
- [ ] El laberinto de una misma ronda es idéntico entre partidas y entre navegadores (semilla = número de ronda).
- [ ] Las celdas de aparición de ambos tanques y sus cuatro ortogonales están siempre libres: ningún tanque nace encerrado.
- [ ] En las rondas 1 a 50 el laberinto es conexo: desde la celda del jugador se alcanza por flood fill la de la CPU y toda celda `empty` del mapa.
- [ ] El generador nunca entra en bucle: agotados los `MAZE_ATTEMPTS` re-sorteos, devuelve la plantilla fija.
- [ ] `selfCheck()` está exportado desde `engine.ts`, es puro y devuelve `[]`; `tanques-canvas.tsx` solo lo llama bajo `process.env.NODE_ENV === "development"` y no aparece en el bundle de producción.
- [ ] Una bala que no impacta nada desaparece antes de `MAX_BULLET_LIFE + 1` s, aunque no haya agotado sus rebotes.
- [ ] Con un frame largo (`update(1, ...)`, o volviendo a la pestaña tras 30 s en segundo plano) la bala no acaba dentro de una celda `brick`/`steel` ni fuera de la arena.
- [ ] El tanque CPU, empujado de frente contra un muro, cambia de celda antes de `AI_STUCK_TIMEOUT + 1` s.
- [ ] Las flechas orientan y mueven el tanque; el tanque no atraviesa `brick` ni `steel` ni el borde de la arena.
- [ ] `Espacio`/`Z` dispara y no scrollea la página; no se puede tener más de una bala propia en vuelo.
- [ ] La bala rebota contra `steel` hasta 2 veces y desaparece al tercer impacto.
- [ ] La bala destruye un `brick` al primer impacto y suma +5.
- [ ] La bala propia, después de rebotar, destruye al tanque del jugador si lo alcanza.
- [ ] Destruir el tanque CPU suma +100 × ronda, avanza de ronda y genera un mapa nuevo.
- [ ] Ganar una ronda sin recibir ningún impacto suma +50 adicionales.
- [ ] Ser destruido resta una vida y reinicia la ronda actual con el mismo mapa; a 0 vidas el motor pasa a `"gameover"`.
- [ ] La CPU dispara solo cuando el jugador está alineado en fila o columna y no hay `steel` entre medias.
- [ ] La CPU es medible más rápida y de mayor cadencia en la ronda 5 que en la 1.
- [ ] El HUD de `/jugar/tanques` muestra Puntuación / Vidas / Nivel reales del snapshot, no el `setInterval` del placeholder.
- [ ] "PAUSA" congela el juego (el loop sigue vivo pero no avanza `dt`); "REANUDAR" continúa donde quedó.
- [ ] "FIN" fuerza `"gameover"` con el score real y muestra el modal existente.
- [ ] "JUGAR DE NUEVO" reinicia a ronda 1, 3 vidas y score 0.
- [ ] "GUARDAR PUNTUACIÓN" inserta una fila real en `scores` (`game_id: "tanques"`) vía `saveScore`, y esa fila aparece en `/juego/tanques` y en la pestaña TANQUES de `/salon`. En ningún punto del flujo de `tanques` se usa `seededScores`.
- [ ] Sin filas en `scores` para `tanques`, `/juego/tanques` y la pestaña del salón muestran el mensaje de estado vacío, no un podio roto.
- [ ] Al salir de `/jugar/tanques` no quedan `requestAnimationFrame` ni listeners de teclado activos.
- [ ] Ningún otro `id` de juego cambia de comportamiento.

## Decisiones tomadas y descartadas

- **Juego nuevo `tanques` en vez de reusar `duelo-pixel`.** Motivo: `duelo-pixel` es el hueco reservado de Pong (dos palas y una bola); ocuparlo con un laberinto borraría una idea distinta del catálogo.
- **VERSUS como categoría.** Motivo: es la única categoría sin ningún motor real; el criterio de hueco pesa más aquí que en cualquier otra.
- **`color: "magenta"`.** Motivo: primer magenta fuera de `caida`; VERSUS hoy solo tiene cyan.
- **Balas con rebote (Combat) en vez de balas que mueren en el muro (Battle City).** Motivo: el rebote es lo que convierte un laberinto en un juego de cálculo y no de reflejos, y diferencia el duelo de cualquier shooter del catálogo.
- **La bala propia mata al jugador tras rebotar.** Motivo: sin esa regla el rebote es solo decoración; con ella cada disparo es una decisión.
- **Una sola bala propia en vuelo.** Motivo: mantiene el motor trivial (un objeto, no una lista) y obliga a apuntar en vez de ametrallar.
- **Laberinto generado con semilla determinista por ronda, no fijo ni aleatorio puro.** Motivo: un mapa aleatorio hace incomparables las puntuaciones del leaderboard; uno fijo se memoriza en tres partidas.
- **IA sin pathfinding: persecución por ejes + disparo por alineación.** Motivo: un BFS por frame es el mayor coste del juego y la diferencia percibida es mínima en una arena de 21×15; se sube la dificultad con velocidad y cadencia, que es medible.
- **Sin multijugador local a dos teclados.** Motivo: no hay HUD ni leaderboard para dos jugadores; un score compartido no tiene sentido en la tabla `scores`.
- **Descartado el multijugador remoto.** Motivo: exige infraestructura de red fuera del patrón motor+canvas.
- **Sin power-ups ni tipos de muro extra.** Motivo: cada uno añade estado al motor sin cambiar el verbo del juego; se decide en spec futuro si se pide.
- **Leaderboard real desde el día uno (`getTopScores`/`saveScore`), nunca `seededScores`.** Motivo: decisión ya cerrada desde spec 07.
- **Patrón motor+canvas de asteroides al pie de la letra** (Strict Mode, teclado scopeado, DPR + `ResizeObserver`, `forwardRef`). Motivo: decisión ya cerrada en spec 06.
- **Sin sonido ni controles táctiles.** Motivo: fuera de alcance por defecto en todo spec de juego.
- **`selfCheck()` en desarrollo en vez de un runner de tests.** Motivo: el repo no tiene hoy ninguna dependencia de testing y este spec no es el sitio para introducirla; una función pura llamada desde el efecto de montaje comprueba lo mismo, se ejecuta en cada sesión de `npm run dev` y no añade dependencias ni scripts.
- **Dos topes por riesgo donde el fallo es silencioso** (`MAX_BOUNCES` + `MAX_BULLET_LIFE`, rebote de dirección + `AI_STUCK_TIMEOUT`). Motivo: un bucle infinito de bala o una CPU clavada no lanzan error, solo arruinan la partida; el segundo tope cubre el bug del primero y cuesta una línea.

## Riesgos

Cada mitigación es código de un paso concreto, no una intención: la columna "Dónde vive" nombra la
constante y la comprobación que la sostienen. Ninguna se puede añadir después sin reescribir su función,
por eso todas entran en el paso 3.

| Riesgo | Mitigación | Dónde vive |
|---|---|---|
| El rebote de la bala puede quedar atrapado en una esquina cóncava y rebotar indefinidamente. | `MAX_BOUNCES = 2` acota la vida de la bala por construcción, y `MAX_BULLET_LIFE = 4 s` la mata aunque el contador de rebotes falle. Dos topes independientes: el segundo cubre el bug del primero. | Paso 3, viñeta 2. `selfCheck()` #3. |
| Un frame largo (pestaña en segundo plano, GC, portátil dormido) hace que la bala salte una celda entera y atraviese un muro (*tunneling*). | `dt = Math.min(dt, MAX_DT)` al entrar en `update()`, y avance de la bala en subpasos de `BULLET_SUBSTEP = 8` px con colisión en cada subpaso: nunca recorre más de 8 px sin comprobar, contra celdas de 40 px. | Paso 3, viñeta 1. `selfCheck()` #4 + prueba de pestaña del paso 9. |
| La generación aleatoria del laberinto puede encerrar a un tanque o partir la arena en dos regiones inconexas: la ronda se vuelve injugable y, como la semilla es la ronda, le pasa a **todos** los jugadores. | Celdas de aparición y ortogonales siempre libres + flood fill que exige que la CPU y toda celda `empty` sean alcanzables desde el jugador. Si falla, re-sorteo con `seed + 1` hasta `MAZE_ATTEMPTS = 8`; agotados, plantilla fija embebida — el bucle está acotado, nunca cuelga el hilo. | Paso 3, viñeta 3. `selfCheck()` #1 y #2. |
| La CPU sin pathfinding puede quedarse pegada empujando contra un muro y convertir la ronda en un paseo. | Al colisionar elige una ortogonal libre y la mantiene `AI_DIR_HOLD = 0.4 s` antes de reevaluar (evita el temblor de decidir cada frame); si además pasa `AI_STUCK_TIMEOUT = 1.5 s` sin cambiar de celda, fuerza el cambio. El temporizador cubre el caso que el rebote de dirección no ve: oscilar entre dos celdas. | Paso 3, viñeta 4. `selfCheck()` #5. |
| Una CPU demasiado certera hace el juego frustrante en la ronda 1. | La cadencia arranca en 1.2 s y el desvío inicial es alto; el escalado por ronda está acotado (`max(0.35, ...)`). Único riesgo sin comprobación automática: es percepción, no corrección. | Se ajusta jugando en el paso 9. |
