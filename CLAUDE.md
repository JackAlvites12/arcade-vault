# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## About the project

Arcade Vault is a retro arcade web platform: a catalog of browser-playable minigames where users compete
for the highest score on leaderboards. It combines a browsable catalog (`/biblioteca`), a hall-of-fame
(`/salon`), per-game detail pages with a leaderboard (`/juego/[id]`), and a generic player (`/jugar/[id]`)
that mounts each game's specific engine. Five games have a real engine (`asteroides`, `tetris`, `arkanoid`,
`culebra`, `frogger`); the rest still use a generic placeholder. The game catalog and the leaderboards of the
real games are backed by Supabase; the remaining games still show `seededScores()` mock data.

## Idioma

Always answer in Spanish, in all sessions.

## Spec-driven workflow

This project follows spec-driven development via project skills in `.claude/skills/` (`spec`, `spec-impl`,
`caveman`, `frontend-design` mirrored in `.agents/skills/` and installed from GitHub — see
`skills-lock.json`; `pr`, `add-game` and `spec-impl-game` are local to this repo):

- `/spec` — designs a new spec interactively (clarifying questions first, no code) and saves it under
  `specs/NN-name.md` using `specs/.../template.md`. A spec only moves to implementation once its status
  is "Approved".
- `/add-game` — domain wrapper over `/spec` for adding a **new game**: gathers origin (port from
  `references/started-games/` or from scratch), controls, assets, and catalog metadata, then invokes
  `/spec` to write the file. Never writes code. Always assumes a real Supabase leaderboard.
- `/spec-impl <NN-spec-name>` — reads the approved spec, creates/checks out a branch named after it, and
  implements it step by step with pauses to review diffs.
- `/spec-impl-game <NN-spec-name>` — variant of `/spec-impl` for specs that add a new game (from
  `/add-game` or a promoted game-jam spec): invokes `/spec-impl` live for the implementation, then chains
  `skin-designer` and `mobile-porter` once the acceptance criteria are done, to close the visual/responsive
  layer of what was just added.
- `/pr` — orchestrates committing work and opening the PR once a spec is implemented (see
  `specs/05-orquestador-pr.md`).

Existing specs in `specs/`: `01-mvp-visual`, `02-home`, `03-about-contact-form`, `04-supabase-setup`,
`05-orquestador-pr`, `06-asteroides`, `07-leaderboard-y-tabla-juegos`, `08-implement-tetris-game`,
`09-implement-arkanoid-game`, `10-implement-culebra-game`, `11-controles-tactiles`,
`12-endurecimiento-rendimiento-mobile`, `13-autenticacion-supabase`, `14-checklist-seguridad-basico`. Read
the two most recent before writing a new one (per `/spec`); for a new game, `/add-game` mandates reading
`06` and `07` regardless of date.

`references/started-games/` holds the source prototypes to port: `02-asteroids` (done), `03-tetris` (done),
`04-arkanoid` (done).

## Subagents

`.claude/agents/` holds project subagents:

- `game-planner` — sits **upstream** of `/add-game`: decides *which* game is worth adding. Reads the live
  `games` table via Supabase MCP, the engines in `app/games/`, the types in `app/data/games.ts` and the
  `.cover-*` classes, then returns 3 ranked candidates with a catalog card ready for `/add-game`. Scores
  every idea against four criteria (catalog gap, implementation cost, no overlap with real engines or
  placeholders, neon/CRT visual fit). Never writes code or specs. Its memory of past suggestions lives in
  `references/game-suggestions.md` (append-only table, verdicts `propuesto`/`descartado`/`implementado`) —
  the agent reads it on start and updates it before finishing, so a discarded idea is not re-proposed
  without justification.
- `game-jam` — takes a free-form **theme** ("juego sobre café") and returns 3 *different* games, each
  with a **complete spec already written** to `specs/game-jam/<tema>-<id>.md`, scored against the same
  four criteria as `game-planner`. Fixes the 3 angles (each with a distinct game verb) before writing
  any file, so the sequential drafting doesn't collapse into variations of the first one. Spec shape is
  copied from `specs/08-implement-tetris-game.md` / `09-implement-arkanoid-game.md`. Proposes a favourite
  but **never picks the winner** — the user does. A second invocation (`@game-jam promover
  specs/game-jam/<file>.md`) promotes the winner to `specs/game-jam/NN-implement-<id>-game.md` (global
  `NN` sequence, shared with `specs/` root) and then deletes all three jam drafts — the promoted spec is
  a full copy of the winner, and the record of the losers lives in the shared memory. Everything this agent
  writes stays inside `specs/game-jam/`; since `/spec-impl` only lists `specs/` at root level, a
  promoted spec is implemented by passing the full path. Shares the `references/game-suggestions.md`
  memory with `game-planner`. Never writes code.
- `skin-designer` — the only subagent that **does write code**, and only the visual layer. Audits that
  every game with a real engine has the three skins — `clasico` (default), `neon`, `retro` — and
  implements the missing ones. Source of truth is `app/games/<id>/skins.ts` (`SkinName`, `Skin`,
  `SKINS`, `DEFAULT_SKIN`); a skin covers engine palette + cover art + CRT frame. `clasico` must
  reproduce today's hex values exactly, so the default look never regresses. The engine holds the skin
  as a public mutable field (switching skins doesn't restart the run), `<id>-canvas.tsx` takes an
  optional `skin` prop, `.skin-neon`/`.skin-retro` modifiers in `globals.css` handle covers (via
  `filter`, no new `.cover-*` classes) and the `--crt-glow` var, and `jugar-client.tsx` renders the
  3-chip selector. Arkanoid is the special case: it draws PNG sprites, so its `Skin` adds a
  `spriteFilter` applied as `ctx.filter` in the existing offscreen pass of `spritesheet.ts` — never
  alternative spritesheets. Never touches gameplay, scoring or `saveScore`; placeholder games (no
  `engine.ts`) are out of scope. No memory file: the audit derives from the filesystem.
- `mobile-porter` — audits and implements responsive/mobile layout for the **whole site** (not just
  the real-engine games): home, `/biblioteca`, `/salon`, `/juego/[id]`, `/jugar/[id]`, `/acerca`,
  `/auth`. Complements `specs/11-controles-tactiles.md`, which already covers touch controls and the
  compact HUD for the real engines — this agent fills the gap that spec left out: layout,
  typography, spacing, and nav in a mobile viewport, a concern every other spec only ever mentioned
  as a loose checklist item. "Mobile" here means the same Next.js site viewed in a mobile browser —
  there's no native app or PWA in this repo. Prefers Tailwind utilities already used in a file, then
  pure CSS media queries reusing an existing breakpoint (`max-width: 820px`, `900px`) over inventing
  new ones. Never edits the touch-control classes or compact-HUD block spec 11 already shipped
  (`.touch-dpad`, `.touch-controls`, `.touch-joystick-*`, `.touch-shoot-btn`) — only adds around them.
  Never touches `engine.ts`, `EngineInput`, scoring, or `saveScore`. No memory file: the audit derives
  from the filesystem.
- `game-performance-booster` — audits and hardens the performance of **one real-engine game at a
  time**, received by id (unlike `skin-designer`/`mobile-porter`, it is scoped per invocation by
  design, never full-site). Applies the closed checklist from `specs/12-endurecimiento-rendimiento-mobile.md`
  to that game's `engine.ts` and `<id>-canvas.tsx`: no per-frame allocations in the RAF/`update(dt)`
  loop, `devicePixelRatio`/canvas size cached and recomputed only on resize, static elements (background,
  grid, board border) not redrawn when unchanged, touch listeners from spec 11 without redundant
  per-event work, and the dev-only FPS overlay (`app/lib/use-fps-counter.ts`) wired if missing. Stops
  immediately if the id has no `engine.ts` (placeholder). Never touches gameplay, scoring, or the shape
  of `EngineInput`/`EngineSnapshot`/`EngineState`; never redesigns spec 11's touch controls, only
  reviews their per-event cost. No memory file: the id is supplied on every invocation.
- `security-auditor` — audits security of the Supabase database (RLS, advisors, Auth protections) and of
  the application (HTTP headers, input validation, secret handling, auth flow). Read-only: never edits
  app code or applies migrations, only reads and runs read-only queries/advisors, returning a findings
  report with severity. Memory lives in `references/security/security-findings.md` (append-only table,
  columns hallazgo/área/severidad/veredicto: `pendiente`/`resuelto`/`aceptado-riesgo`/`no-aplica`), updated
  in place rather than duplicated. Fixes are left for the user or a future spec (precedent: specs 13 and
  14) — unlike `skin-designer`/`mobile-porter`/`game-performance-booster`, this agent never implements
  fixes itself. Complements, not replaces, the generic `/security-review` skill (which reviews the current
  branch's pending diff): this agent audits the full repo and Supabase project state.

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
`saveScore(gameId, playerName, score, userId?)`, over the Supabase tables `games` and `scores` (public RLS:
read on both, insert on `scores`). Schema lives only in Supabase — applied via MCP `apply_migration`, no
local `supabase/migrations` folder. See `specs/07-leaderboard-y-tabla-juegos.md` and
`specs/13-autenticacion-supabase.md` (`scores.user_id`).

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

Five games follow the same pattern under `app/games/<id>/`: a pure `engine.ts` (game-state simulation,
`EngineState`/`EngineSnapshot`/`EngineInput`, score/lives/level) plus a `<id>-canvas.tsx` client component
(`<canvas>` rendering + scoped keyboard/mouse input, `forwardRef` handle with `restart()`/`forceGameOver()`,
DPR-aware resize via `ResizeObserver`, single Strict-Mode-safe mount effect) that reports snapshots up via
`onSnapshot`. `jugar-client.tsx` branches on `game.id` to mount the right canvas; any game not in that list
falls back to the generic placeholder (a `setInterval` adding random score every 220ms — not real gameplay).

Reference implementation to copy: `app/games/asteroides/`. New games should use `/add-game` and follow this
pattern with a real Supabase leaderboard from day one, never extend the placeholder.

### Auth and session

Real auth backed by Supabase Auth (`specs/13-autenticacion-supabase.md`): email/password (with mandatory
email confirmation) plus Google and Github OAuth. `app/session-context.tsx` (`SessionProvider`/`useSession`)
mirrors the real Supabase session (`getSession` + `onAuthStateChange`) via
`lib/supabase/client.ts`'s `getSupabaseBrowserClient()`, persisted in `localStorage` (survives reload) — no
`@supabase/ssr`, cookies, or `middleware.ts`. `app/auth/callback/page.tsx` handles the OAuth return
(`exchangeCodeForSession`) and redirects to `/biblioteca`; `/auth` itself redirects there too when a session
is already active. Guest mode (`playAsGuest`) is untouched. `app/auth/page.tsx` is the login/register screen;
its "CREAR CUENTA" tab shows a live password-requirements checklist (`PASSWORD_RULES`: length, lowercase,
uppercase, digit, symbol) as a tooltip and disables submit until all rules pass
(`specs/14-checklist-seguridad-basico.md`). Scores are saved via `saveScore(gameId, playerName, score,
userId?)` — `scores.user_id` (nullable, FK to `auth.users`) links a score to the logged-in user when there
is a session, stays `null` in guest mode. `app/api/health/supabase/route.ts` is a connectivity health check.

`next.config.ts` sets 3 security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`) on every route via `headers()`. Known accepted-risk
security findings (leaked-password protection needs a paid Supabase plan; public `scores` insert without
server-side range/length validation) are tracked in `references/security/security-findings.md`, maintained
by the `security-auditor` subagent — see specs `13` and `14`.

### Contact form

`app/api/contact/route.ts` sends email via Resend (`RESEND_API_KEY`, `CONTACT_TO_EMAIL` in `.env`), used by
the form on `app/acerca/page.tsx`.

### Visual language

Neon/CRT retro-arcade look: colors `cyan`/`magenta`/`green`/`yellow` (see `GameColor` in
`app/data/games.ts`), podium colors `gold`/`silver`/`bronze` (see `app/lib/rank-color.ts`), fonts Press
Start 2P (`font-pixel`) / Courier Prime / JetBrains Mono, CRT scanline effect applied via `.crt` /
`.crt-screen` classes, and per-game cover art via `.cover-*` classes — all defined in `app/globals.css`.
