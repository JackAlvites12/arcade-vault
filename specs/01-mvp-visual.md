# 01 - MVP Visual Arcade Vault

**Estado:** Implementado
**Depende de:** Ninguno (primer spec del repo)
**Fecha:** 2026-07-23

## Objetivo

Construir el MVP visual completo de Arcade Vault en Next.js App Router — biblioteca, detalle de juego, reproductor (placeholder genérico), salón de la fama y autenticación — replicando fielmente el lenguaje visual neón/CRT del prototipo en `references/templates/`, con rutas reales, datos ficticios en `app/data`, estado de sesión solo en memoria, y sin implementar lógica de ningún juego ni backend.

## Alcance

### Incluye

- Layout raíz (`app/layout.tsx`) con fuentes vía `next/font/google` (Press Start 2P, Courier Prime, JetBrains Mono), `Nav` global y footer, tal como en el prototipo.
- Theme tokens de Tailwind v4 (`app/globals.css`, `@theme inline`) portando las variables neón/CRT de `styles.css` (colores, glow, fuentes).
- `app/data/games.ts`: datos ficticios portados de `data.jsx` (`GAMES`, `CATS`, `PLAYERS`, `seededScores()`), documentados como datos temporales que eventualmente vendrán de una base de datos.
- Ruta `/` → redirige a `/biblioteca`.
- Ruta `/biblioteca`: hero, buscador, chips de categoría, grid de tarjetas de juego (con tilt on hover), estado "sin resultados".
- Ruta `/juego/[id]` (detalle): portada, tags, descripción, stats, leaderboard del juego (vía `seededScores`), CTA "JUGAR AHORA" y "VOLVER AL VAULT".
- Ruta `/jugar/[id]` (reproductor): HUD (puntuación, vidas, nivel), arena CRT con el placeholder animado idéntico al prototipo (enemigos flotantes + incremento de score cada 220ms vía `setInterval`), pausa, fin de partida, modal de puntuación final con guardado cosmético (toast, sin persistir a ningún lado).
- Ruta `/salon`: podio (top 3), tabla completa por juego seleccionado (tabs), fila "tu mejor marca" cuando hay usuario en sesión — misma lógica de `seededScores()`.
- Ruta `/auth`: tabs iniciar sesión / crear cuenta, formulario, botón "jugar como invitado", botones sociales decorativos. Al enviar, navega a `/biblioteca` y setea el usuario en un estado de sesión en memoria (React Context), reflejado en el `Nav`.
- Nav responsive: enlaces desktop + panel móvil (hamburguesa), estado activo por ruta, contador de créditos estático, botón de sesión/perfil.

### No incluye (fuera de este spec)

- Lógica de juego real para ninguno de los 8 títulos (siguen siendo el mismo placeholder genérico).
- Persistencia real de sesión o puntuaciones (nada de localStorage, cookies, ni base de datos).
- Backend, API routes, o autenticación real (OAuth de Google/GitHub son botones decorativos sin acción).
- Vincular el "guardar puntuación" del reproductor con el leaderboard del salón.
- Responsive/mobile detallado más allá de lo que ya trae el prototipo (menú hamburguesa).
- Tests automatizados de UI.

## Modelo de datos

Todo vive en `app/data/games.ts`, marcado como ficticio/temporal (eventualmente vendrá de una base de datos).

```typescript
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "green" | "yellow";

export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;       // clase CSS del fondo de portada (cover-bricks, cover-tetro, ...)
  color: GameColor;
  best: number;
  plays: string;       // ya formateado, ej. "12.4K"
}

export const GAMES: Game[] = [ /* 8 juegos portados de data.jsx */ ];
export const CATS: Array<"TODOS" | GameCategory> = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"];
export const PLAYERS: string[] = [ /* 18 nombres portados de data.jsx */ ];

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string; // "DD/MM/2026"
}

export function seededScores(seed: number, count?: number): ScoreRow[];
// misma implementación LCG que el prototipo (determinística por seed)
```

Estado de sesión (no persistido), vía React Context en el layout raíz:

```typescript
export interface SessionUser {
  name: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  login: (user: SessionUser | null) => void; // null = invitado
  signOut: () => void;
}
```

## Plan de implementación

1. **Datos y tema base.** Crear `app/data/games.ts` con `Game`, `GAMES`, `CATS`, `PLAYERS`, `ScoreRow`, `seededScores()`. Definir theme tokens neón/CRT en `app/globals.css` (`@theme inline`: colores cyan/magenta/green/yellow/gold, fondos, glow, bordes). Configurar fuentes (Press Start 2P, Courier Prime, JetBrains Mono) con `next/font/google` en `app/layout.tsx`.

2. **Contexto de sesión + Nav.** Crear `AuthContext` (provider en `app/layout.tsx`, estado en memoria: `user`, `login`, `signOut`). Construir componente `Nav` (logo, links Biblioteca/Salón, contador de créditos, botón sesión/perfil, panel móvil con hamburguesa). Footer estático. `app/page.tsx` redirige a `/biblioteca`.

3. **Biblioteca (`/biblioteca`).** Hero con título parpadeante, buscador, chips de categoría, grid de `GameCard` (tilt on hover, portada, título, descripción, mejor puntuación, botón JUGAR), estado vacío "sin resultados". Filtra por texto + categoría en cliente.

4. **Detalle (`/juego/[id]`).** Portada, tags, descripción larga, stats (partidas, mejor global, dificultad), leaderboard lateral vía `seededScores(id)`, CTAs a reproductor y biblioteca.

5. **Auth (`/auth`).** Tabs iniciar sesión / crear cuenta, formulario controlado, botón "jugar como invitado", botones sociales decorativos (sin acción). Submit llama a `login()` del contexto y navega a `/biblioteca`.

6. **Salón (`/salon`).** Tabs por juego, podio top 3, tabla completa vía `seededScores()`, fila "tu mejor marca" si hay usuario en sesión.

7. **Reproductor (`/jugar/[id]`).** HUD (jugador, puntuación, vidas, nivel), arena CRT con placeholder animado (enemigos flotantes + `setInterval` que suma score), pausa/reanudar, botón fin, modal de fin de partida con input de iniciales y botón "guardar puntuación" (toast cosmético, sin persistir), reiniciar o volver a biblioteca.

8. **Pulido visual final.** Pasada de consistencia con `/frontend-design`: transiciones (`fade-in`, `slide-in`), estados hover/active, responsive de nav y grid, revisar contraste y glow en modo claro/oscuro si aplica.

## Criterios de aceptación

- [x] `/` redirige a `/biblioteca`.
- [x] `/biblioteca` muestra las 8 tarjetas de juego con portada, categoría, título, descripción y mejor puntuación.
- [x] El buscador filtra por título y los chips filtran por categoría (incluyendo "TODOS"); combinación de ambos sin resultados muestra el estado vacío.
- [x] Click en una tarjeta o su botón "JUGAR" navega a `/juego/[id]` con el `id` correcto.
- [x] `/juego/[id]` muestra portada, tags, descripción larga, stats (partidas, mejor global, dificultad) y un leaderboard de 10 filas generado por `seededScores`.
- [x] Botón "JUGAR AHORA" navega a `/jugar/[id]`; "VOLVER AL VAULT" navega a `/biblioteca`.
- [x] `/jugar/[id]` anima la arena (enemigos + nave) y el HUD incrementa la puntuación automáticamente cada ~220ms mientras no está en pausa ni terminado.
- [x] Pausa detiene el incremento de puntuación y muestra overlay "EN PAUSA"; reanudar lo retoma.
- [x] Botón "FIN" abre el modal con puntuación final, input de iniciales y botón "GUARDAR PUNTUACIÓN" que muestra el toast "PUNTUACIÓN GUARDADA_" sin persistir en ningún lado.
- [x] "JUGAR DE NUEVO" reinicia puntuación/vidas/nivel; "VOLVER AL VAULT" navega a `/biblioteca`.
- [x] `/salon` muestra tabs por los 8 juegos, podio top 3 y tabla completa de 12 filas vía `seededScores`, coherentes con el juego seleccionado.
- [x] Si hay usuario en sesión, `/salon` muestra la fila "tu mejor marca"; si no hay usuario, no aparece.
- [x] `/auth` permite alternar entre "iniciar sesión" y "crear cuenta"; el formulario de registro muestra el campo de correo adicional.
- [x] Enviar el formulario (o "jugar como invitado") navega a `/biblioteca` y el `Nav` refleja el nombre de usuario (o queda como invitado) sin recargar la página.
- [x] Refrescar el navegador pierde el estado de sesión (no hay persistencia).
- [x] El `Nav` marca como activa la sección correspondiente en biblioteca, detalle, reproductor y salón; el panel móvil (hamburguesa) abre/cierra y navega igual que los links de escritorio.
- [x] Ningún archivo del proyecto contiene lógica de juego real (colisiones, físicas, reglas) para ninguno de los 8 títulos.
- [x] No hay llamadas a `localStorage`, `fetch`, ni rutas de API en todo el MVP.

## Decisiones tomadas y descartadas

- **Rutas reales del App Router** en vez de hash-routing del prototipo. Motivo: `AGENTS.md`/`CLAUDE.md` piden explícitamente no replicar el patrón de `route` en `app.jsx`.
- **Estado de sesión en memoria (React Context), sin localStorage.** Motivo: el spec es solo visual; se descarta portar `av_user`/`av_scores` para no simular persistencia inexistente.
- **"Guardar puntuación" es cosmético**, no alimenta el salón. Motivo: mantener `app/data` desacoplado de interacciones de sesión; evita estado compartido complejo para un MVP visual.
- **Placeholder del reproductor se mantiene idéntico al prototipo** (arena + `setInterval` de score aleatorio). Descartado: dejarlo estático sin animación — se prefiere conservar la sensación de "jugando" aunque no haya juego real.
- **Estilos como theme tokens de Tailwind v4** (`@theme inline`) en vez de portar `styles.css` como archivo aparte. Motivo: consistencia con la arquitectura ya establecida en el repo (Tailwind v4, sin config file).
- **Fuentes vía `next/font/google`** en vez de `<link>` a Google Fonts. Motivo: optimización nativa de Next.js (sin FOUC, self-hosted).
- **Botones sociales (Google/GitHub) y OAuth quedan decorativos**, sin acción real. Motivo: fuera de alcance de un MVP visual sin backend; si se requiere auth real, amerita spec propio.
- **Toda clase Tailwind debe usar su forma canónica cuando exista equivalente**, en vez de un valor arbitrario `[...]` (ej. `max-w-330` y no `max-w-[1320px]`; `aspect-4/3` y no `aspect-[4/3]`; `bg-linear-to-b` y no `bg-gradient-to-b`; `z-55` y no `z-[55]`). Motivo: Tailwind v4 expone una escala de espaciado dinámica (múltiplos de 0.25rem) y utilidades renombradas respecto a v3; la forma canónica es más corta y consistente en todo el proyecto. Un valor arbitrario solo se justifica cuando no existe utilidad equivalente (gradientes/`clip-path`/sombras compuestas, etc.).
