# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## About the project

Arcade Vault is a retro arcade web platform: a catalog of browser-playable minigames where users compete
for the highest score on leaderboards. It combines a browsable catalog (`/biblioteca`), a hall-of-fame
(`/salon`), per-game detail pages with a leaderboard (`/juego/[id]`), and a generic player (`/jugar/[id]`)
that mounts each game's specific engine. Four games have a real engine (`asteroides`, `tetris`, `arkanoid`,
`culebra`); the rest still use a generic placeholder. The game catalog and the leaderboards of the four
real games are backed by Supabase; the remaining games still show `seededScores()` mock data.

## Idioma

Always answer in Spanish, in all sessions.

## Spec-driven workflow

This project follows spec-driven development via project skills in `.claude/skills/` (`spec`, `spec-impl`,
`caveman`, `frontend-design` mirrored in `.agents/skills/` and installed from GitHub — see
`skills-lock.json`; `pr` and `add-game` are local to this repo):

- `/spec` — designs a new spec interactively (clarifying questions first, no code) and saves it under
  `specs/NN-name.md` using `specs/.../template.md`. A spec only moves to implementation once its status
  is "Approved".
- `/add-game` — domain wrapper over `/spec` for adding a **new game**: gathers origin (port from
  `references/started-games/` or from scratch), controls, assets, and catalog metadata, then invokes
  `/spec` to write the file. Never writes code. Always assumes a real Supabase leaderboard.
- `/spec-impl <NN-spec-name>` — reads the approved spec, creates/checks out a branch named after it, and
  implements it step by step with pauses to review diffs.
- `/pr` — orchestrates committing work and opening the PR once a spec is implemented (see
  `specs/05-orquestador-pr.md`).

Existing specs in `specs/`: `01-mvp-visual`, `02-home`, `03-about-contact-form`, `04-supabase-setup`,
`05-orquestador-pr`, `06-asteroides`, `07-leaderboard-y-tabla-juegos`, `08-implement-tetris-game`,
`09-implement-arkanoid-game`, `10-implement-culebra-game`. Read the two most recent before writing a new
one (per `/spec`); for a new game, `/add-game` mandates reading `06` and `07` regardless of date.

`references/started-games/` holds the source prototypes to port: `02-asteroids` (done), `03-tetris` (done),
`04-arkanoid` (done).

## Skills

Always use /frontend-design to design the user interface.

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4 (`@import "tailwindcss"` + `@theme inline` in
`app/globals.css`, no `tailwind.config.js`). Path alias `@/*` → repo root.

**This Next.js version has breaking changes vs. training data.** Before writing framework-specific code
(routing, data fetching, config, fonts, images, etc.), read the matching guide under
`node_modules/next/dist/docs/` (sections: `01-app`, `02-pages`, `03-architecture`, `04-community`) rather
than relying on prior Next.js knowledge.

### Data layer (Supabase)

`app/data/db.ts` is the only data access layer: `getGames()`, `getGame(id)`, `getTopScores(gameId, limit)`,
`saveScore(gameId, playerName, score)`, over the Supabase tables `games` and `scores` (public RLS: read on
both, insert on `scores`). Schema lives only in Supabase — applied via MCP `apply_migration`, no local
`supabase/migrations` folder. See `specs/07-leaderboard-y-tabla-juegos.md`.

`app/data/games.ts` no longer holds the game catalog: it keeps only the types (`Game`, `ScoreRow`,
`GameCategory`, `GameColor`), `CATS`, `PLAYERS` and `seededScores()` — the deterministic LCG mock still used
by the games without a real engine.

### Routes: catalog vs. hall vs. detail vs. player

Every data-fetching route is a **server** component that awaits `db.ts` and hands results to a sibling
`*-client.tsx`:

- `app/biblioteca/page.tsx` → `biblioteca-client.tsx` — catalog, filterable by `CATS`.
- `app/salon/page.tsx` → `salon-client.tsx` — hall of fame; fetches the top-10 of each real game in
  parallel and falls back to `seededScores` for the rest.
- `app/juego/[id]/page.tsx` — game detail (cover, description, leaderboard). Real games get
  `getTopScores`, the others `seededScores`. Links to `/jugar/[id]`.
- `app/jugar/[id]/page.tsx` → `jugar-client.tsx` — the actual player. The client renders the shared HUD
  (score/lives/lines/level/pause), swaps in per-game gameplay by `game.id`, and calls `saveScore` on
  "GUARDAR PUNTUACIÓN".

`app/lib/` holds small shared client helpers (`rank-color.ts`, `use-reveal.ts`); `app/components/` the UI
primitives (`button`, `chip`, `cover-art`, `game-card`, `home-sections`, `nav`).

### Per-game engines

Four games follow the same pattern under `app/games/<id>/`: a pure `engine.ts` (game-state simulation,
`EngineState`/`EngineSnapshot`/`EngineInput`, score/lives/level) plus a `<id>-canvas.tsx` client component
(`<canvas>` rendering + scoped keyboard/mouse input, `forwardRef` handle with `restart()`/`forceGameOver()`,
DPR-aware resize via `ResizeObserver`, single Strict-Mode-safe mount effect) that reports snapshots up via
`onSnapshot`. `jugar-client.tsx` branches on `game.id` to mount the right canvas; any game not in that list
falls back to the generic placeholder (a `setInterval` adding random score every 220ms — not real gameplay).

Reference implementation to copy: `app/games/asteroides/`. New games should use `/add-game` and follow this
pattern with a real Supabase leaderboard from day one, never extend the placeholder.

### Auth and session

`app/session-context.tsx` (`SessionProvider`/`useSession`) is an in-memory, client-only session (no
persistence across reloads) used to greet the user and prefill the score-save name in the player page.
`app/auth/page.tsx` is the login/register screen. Real auth is backed by Supabase (`lib/supabase/client.ts`,
`createSupabaseClient()` reads `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, throws if
missing) — see `specs/04-supabase-setup.md`. Scores are saved with a free-text `player_name`, not linked to
an authenticated user. `app/api/health/supabase/route.ts` is a connectivity health check.

### Contact form

`app/api/contact/route.ts` sends email via Resend (`RESEND_API_KEY`, `CONTACT_TO_EMAIL` in `.env`), used by
the form on `app/acerca/page.tsx`.

### Visual language

Neon/CRT retro-arcade look: colors `cyan`/`magenta`/`green`/`yellow` (see `GameColor` in
`app/data/games.ts`), podium colors `gold`/`silver`/`bronze` (see `app/lib/rank-color.ts`), fonts Press
Start 2P (`font-pixel`) / Courier Prime / JetBrains Mono, CRT scanline effect applied via `.crt` /
`.crt-screen` classes, and per-game cover art via `.cover-*` classes — all defined in `app/globals.css`.
