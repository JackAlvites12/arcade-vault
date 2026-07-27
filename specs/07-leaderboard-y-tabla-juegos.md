# 07 — Leaderboard real y tabla de juegos (Supabase)

> **Estado:** Aprobado
> **Depende de:** [04-supabase-setup](04-supabase-setup.md) (cliente Supabase ya instalado), [06-asteroides](06-asteroides.md) (único motor real que genera un score guardable)
> **Fecha:** 2026-07-26
> **Objetivo:** Migrar el catálogo de juegos (`GAMES`) y el leaderboard de Asteroides a tablas reales de Supabase (`games`, `scores`) con lectura y escritura pública, dejando el leaderboard mock (`seededScores`) intacto para los 7 juegos sin motor real.

## Alcance

**Incluye:**

- Migración SQL aplicada al proyecto Supabase (vía MCP `apply_migration`, sin carpeta local `supabase/migrations`): crea tablas `games` y `scores`, políticas RLS, y siembra los 9 juegos actuales de `GAMES` como datos iniciales.
- Nueva capa de datos `app/data/db.ts`: `getGames()`, `getGame(id)`, `getTopScores(gameId, limit)`, `saveScore(gameId, name, score)` usando `createSupabaseClient()`.
- `app/data/games.ts` pierde el array `GAMES` (la tabla es ahora la fuente de verdad del catálogo). `PLAYERS`, `seededScores()` y las interfaces `Game`/`ScoreRow`/`GameCategory`/`GameColor` se mantienen.
- Split server/client en las 4 rutas que hoy importan `GAMES` de forma síncrona:
  - `app/biblioteca/page.tsx` (server, `getGames()`) → `app/biblioteca/biblioteca-client.tsx` (client, filtro/búsqueda actual sin cambios).
  - `app/salon/page.tsx` (server, `getGames()` para las pestañas) → `app/salon/salon-client.tsx` (client, misma UI actual).
  - `app/jugar/[id]/page.tsx` (server, `getGame(id)`, `notFound()` si no existe) → `app/jugar/[id]/jugar-client.tsx` (client, toda la lógica actual del reproductor).
  - `app/page.tsx` (server, `getGames()`) pasa `games: Game[]` a `GamesPreviewSection`, `StatsSection` y `LiveActivitySection` (hoy en `app/components/home-sections.tsx`, que importa `GAMES` directamente). Esas 3 secciones reciben `games` por prop en vez de importar `GAMES`; el resto de secciones de la home (`HomeHero`, `WhyVaultSection`, `PricingSection`, `FinalCtaSection`) no cambia. `app/page.tsx` mantiene `"use client"` solo si sigue usando `useReveal`; el fetch de `getGames()` se hace en un server component padre que envuelve el árbol actual.
- `app/juego/[id]/page.tsx` (ya es server component): usa `getGame(id)` en vez de `GAMES.find`.
- Leaderboard real solo para `asteroides`: `getTopScores("asteroides", 10)` reemplaza `seededScores(...)` en `/juego/asteroides` y en la pestaña ASTEROIDES de `/salon`. Si el resultado viene vacío, se muestra un mensaje de estado vacío en vez de una lista/podio vacío.
- Guardado real solo para `asteroides`: en `/jugar/asteroides`, "GUARDAR PUNTUACIÓN" ejecuta `saveScore("asteroides", name, score)` antes de marcar `saved`.
- RLS pública simple: `SELECT` público en `games` y `scores`; `INSERT` público en `scores` (sin validación server-side ni rate limiting).
- `game.best`/`game.plays` de `asteroides` quedan como columnas estáticas de `games`, sin recalcularse desde `scores`.

**Fuera de alcance (para specs futuros):**

- Autenticación real / vincular `player_name` a un usuario autenticado.
- Motor real para los otros 7 juegos — siguen con el placeholder falso y `seededScores()` mock en `/juego/[id]` y `/salon`.
- Recalcular "mejor global" (`game.best`) en vivo desde `scores`.
- Rate limiting, validación server-side, o moderación del contenido de `player_name` en el insert de scores.
- CLI local de Supabase / `supabase/config.toml` / carpeta `supabase/migrations` versionada en el repo.
- Cambios a `CATS`, `PLAYERS`, o al algoritmo de `seededScores()`.
- Migrar `/api/health/supabase` o tocar el endpoint de salud existente.

## Modelo de datos

**Tabla `games`** (siembra inicial = los 9 registros actuales de `GAMES`):

```sql
create table games (
  id text primary key,
  title text not null,
  short text not null,
  long text not null,
  cat text not null,          -- "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS"
  cover text not null,
  color text not null,        -- "cyan" | "magenta" | "green" | "yellow"
  best integer not null,
  plays text not null
);

alter table games enable row level security;
create policy "public read games" on games for select using (true);
```

**Tabla `scores`** (un registro por partida, solo `asteroides` escribe por ahora):

```sql
create table scores (
  id bigint generated always as identity primary key,
  game_id text not null references games(id),
  player_name text not null,
  score integer not null,
  created_at timestamptz not null default now()
);

alter table scores enable row level security;
create policy "public read scores" on scores for select using (true);
create policy "public insert scores" on scores for insert with check (true);
```

**Capa de datos** (`app/data/db.ts`):

```typescript
import { createSupabaseClient } from "@/lib/supabase/client";
import type { Game, ScoreRow } from "@/app/data/games";

export async function getGames(): Promise<Game[]>;
export async function getGame(id: string): Promise<Game | null>;

// ORDER BY score DESC LIMIT limit; mapea created_at -> date ("DD/MM/YYYY"), asigna rank 1..N en memoria
export async function getTopScores(gameId: string, limit: number): Promise<ScoreRow[]>;

export async function saveScore(
  gameId: string,
  playerName: string,
  score: number,
): Promise<void>;
```

`Game` y `ScoreRow` (ya existentes en `app/data/games.ts`) no cambian de forma — las columnas de `games` calzan 1:1 con la interfaz `Game` actual.

## Plan de implementación

1. **Migración Supabase.** Aplicar la migración (vía `apply_migration` del MCP) que crea `games` y `scores`, sus policies RLS, y siembra los 9 registros actuales de `GAMES`. Nada en el código cambia todavía — el sitio sigue funcionando igual, leyendo del array estático.
2. **Capa de datos.** Crear `app/data/db.ts` con `getGames()`, `getGame(id)`, `getTopScores(gameId, limit)`, `saveScore(gameId, name, score)`. Módulo aislado, no importado aún desde ninguna página.
3. **Biblioteca.** Convertir `app/biblioteca/page.tsx` en server component (`getGames()`) que renderiza `app/biblioteca/biblioteca-client.tsx` (client component nuevo con el filtro/búsqueda actual, sin cambios de UI). `/biblioteca` pasa a leer de la tabla.
4. **Detalle de juego.** `app/juego/[id]/page.tsx` usa `getGame(id)` en vez de `GAMES.find`. Si `id === "asteroides"`, usa `getTopScores("asteroides", 10)`; si el resultado viene vacío, la sección "MEJORES PUNTUACIONES" muestra un mensaje de estado vacío (ej. "SIN PUNTUACIONES AÚN · SÉ EL PRIMERO") en vez de la lista de filas. El resto de juegos sigue con `seededScores(id.length * 17 + 3, 10)` igual que hoy.
5. **Salón.** Convertir `app/salon/page.tsx` en server component (`getGames()` para las pestañas) que renderiza `app/salon/salon-client.tsx` (misma UI actual). En la pestaña `asteroides`, si `getTopScores` viene vacío, se oculta el podio (`PodiumSlot`) y la tabla, mostrando el mismo mensaje de estado vacío centrado en su lugar; el resto de pestañas no cambia.
6. **Reproductor.** Convertir `app/jugar/[id]/page.tsx` en server component (`getGame(id)`, `notFound()` si no existe) que renderiza `app/jugar/[id]/jugar-client.tsx` (toda la lógica actual, recibe `game` por prop en vez de `useParams` + `GAMES.find`). En "GUARDAR PUNTUACIÓN", si `isAsteroids`, llama `saveScore("asteroides", name, score)` antes de `setSaved(true)`; el resto de juegos mantiene el guardado local sin red, igual que hoy.
7. **Home.** `app/page.tsx` pasa a ser (o envuelve) un server component que llama `getGames()` y pasa `games` por prop a `GamesPreviewSection`, `StatsSection` y `LiveActivitySection`. Estas 3 funciones en `app/components/home-sections.tsx` dejan de importar `GAMES` y reciben `games: Game[]` como parámetro; el resto de secciones no cambia. Sin cambios visuales.
8. **Limpieza.** Eliminar el array `GAMES` de `app/data/games.ts` (ya ningún archivo lo importa). `PLAYERS`, `seededScores`, y los tipos (`Game`, `ScoreRow`, `GameCategory`, `GameColor`) quedan intactos.
9. **Verificación manual.** Con `npm run dev`: `/biblioteca` lista los 9 juegos desde la tabla; `/` (home) muestra el preview de juegos, stats y actividad en vivo igual que antes; `/juego/asteroides` con `scores` vacía muestra el mensaje de estado vacío; jugar una partida de asteroides, "FIN" → "GUARDAR PUNTUACIÓN" → confirmar que aparece la fila nueva en `/juego/asteroides` y en la pestaña ASTEROIDES de `/salon` (y que el mensaje de vacío desaparece); jugar otro juego mock y confirmar que "GUARDAR PUNTUACIÓN" sigue sin tocar red (Network tab) y el resto del sitio no cambia.

## Criterios de aceptación

- [ ] Las tablas `games` y `scores` existen en Supabase con las columnas, RLS y policies descritas en el modelo de datos.
- [ ] `games` contiene los 9 registros sembrados desde `GAMES` (mismos `id`/`title`/`short`/`long`/`cat`/`cover`/`color`/`best`/`plays`).
- [ ] `app/data/db.ts` expone `getGames`, `getGame`, `getTopScores`, `saveScore` y ninguna otra página importa Supabase directamente para estas operaciones.
- [ ] `/biblioteca` renderiza los 9 juegos leídos de `getGames()`; filtro por categoría y búsqueda por título siguen funcionando igual que hoy.
- [ ] `/juego/asteroides` muestra el leaderboard leído de `getTopScores("asteroides", 10)`, no `seededScores`.
- [ ] `/juego/<cualquier-otro-id>` sigue mostrando `seededScores(...)` sin cambios visuales ni de datos.
- [ ] En `/salon`, la pestaña ASTEROIDES muestra `getTopScores`; el resto de pestañas sigue con `seededScores`.
- [ ] En `/jugar/asteroides`, "GUARDAR PUNTUACIÓN" inserta una fila real en `scores` (`game_id: "asteroides"`, `player_name`, `score`) y esa fila aparece en `/juego/asteroides` y en `/salon` tras refrescar.
- [ ] En `/jugar/<otro-id>`, "GUARDAR PUNTUACIÓN" no genera ninguna petición de red (sigue siendo solo `setSaved(true)` local).
- [ ] `game.best`/`game.plays` de `asteroides` no cambian tras guardar partidas (siguen siendo los valores estáticos de la tabla `games`).
- [ ] `app/data/games.ts` ya no exporta `GAMES`; `PLAYERS`, `seededScores`, y los tipos (`Game`, `ScoreRow`, `GameCategory`, `GameColor`) siguen exportados sin cambios.
- [ ] `/` (home) renderiza el preview de juegos, stats y actividad en vivo leyendo de `getGames()` en vez de `GAMES`, sin cambios visuales.
- [ ] `/acerca` y `/auth` no cambian de comportamiento.
- [ ] Si `scores` no tiene filas para `asteroides`, `/juego/asteroides` y la pestaña ASTEROIDES de `/salon` muestran el mensaje de estado vacío en vez de una lista/podio vacío o roto.

## Decisiones tomadas y descartadas

- **Un solo spec para catálogo de juegos + leaderboard**, en vez de dos specs separados. Motivo: pedido explícito del usuario — mismo cambio de infraestructura Supabase, mismo commit.
- **Leaderboard real solo para `asteroides`.** Motivo: pedido explícito — es el único juego con motor real; el resto no tiene una partida real que registrar.
- **Un registro por partida en `scores`** (sin unicidad por jugador). Motivo: pedido explícito — más simple de escribir (`INSERT` puro, sin `UPSERT` condicional) y permite historial.
- **RLS pública sin restricciones** (`INSERT`/`SELECT` abiertos con la clave pública). Motivo: pedido explícito ("lo más simple") — no hay auth real todavía, agregar rate-limiting o validación server-side sería trabajo no pedido.
- **`game.best`/`game.plays` de asteroides quedan estáticos**, no se recalculan desde `scores`. Motivo: pedido explícito — evita una lectura agregada extra no solicitada.
- **Split server/client en `biblioteca`, `salon`, `jugar/[id]` y home (`app/page.tsx`).** Motivo: consecuencia mecánica de migrar `GAMES` a una tabla — un client component no puede hacer `await` a Supabase, así que el fetch se mueve a un server component padre. La home no estaba listada en la primera versión del spec porque `home-sections.tsx` también importaba `GAMES` de forma síncrona sin haber sido detectado inicialmente.
- **Migración aplicada directo al proyecto Supabase vía MCP**, sin carpeta local `supabase/migrations` ni CLI. Motivo: spec 04 ya dejó explícito que no se instala el stack local de Supabase; agregarlo ahora sería scaffolding no pedido para una sola migración.
- **`GAMES` se elimina** de `app/data/games.ts` en vez de mantenerse como fallback/mock en paralelo a la tabla. Motivo: pedido explícito (opción 1: "Sí migrar games a una tabla") — evita tener dos fuentes de verdad del catálogo.

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| `INSERT` público en `scores` sin restricción permite spam de puntuaciones falsas/masivas. | Aceptado explícitamente por el usuario ("lo más simple"); fuera de alcance — spec futuro puede agregar validación server-side o auth real. |
| `/juego/asteroides` y la pestaña ASTEROIDES de `/salon` pueden mostrar una lista vacía si nadie guardó partidas aún. | Mitigado en los pasos 4 y 5 del plan: mensaje de estado vacío explícito en vez de lista/podio vacío o roto. |
| El split server/client de `biblioteca`/`salon`/`jugar/[id]` cambia la estructura de archivos de 3 rutas existentes. | Cada paso del plan (3, 5, 6) es aislado y verificable por separado; el criterio de aceptación exige que la UI/comportamiento no cambie visualmente. |
| Si faltan las variables de entorno de Supabase en producción, `/biblioteca`, `/juego/[id]` y `/salon` quedarían rotos. | Mismo comportamiento ya aceptado desde spec 04 (`createSupabaseClient()` lanza error explícito); no se agrega manejo especial nuevo. |
