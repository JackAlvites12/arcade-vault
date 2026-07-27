# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Idioma

Always answer in Spanish, in all sessions.

## Spec-driven workflow

This project follows spec-driven development via project skills in `.claude/skills/` (mirrored in
`.agents/skills/`, installed from `Klerith/fernando-skills` — see `skills-lock.json`):

- `/spec` — designs a new spec interactively (clarifying questions first, no code) and saves it under
  `specs/NN-name.md` using `specs/.../template.md`. A spec only moves to implementation once its status
  is "Approved".
- `/spec-impl <NN-spec-name>` — reads the approved spec, creates/checks out a branch named after it, and
  implements it step by step with pauses to review diffs.
- `/pr` — orchestrates committing work and opening the PR once a spec is implemented (see
  `specs/05-orquestador-pr.md`).

Existing specs in `specs/` (read the two most recent before writing a new one, per the `/spec` skill):
`01-mvp-visual`, `02-home`, `03-about-contact-form`, `04-supabase-setup`, `05-orquestador-pr`,
`06-asteroides`.

## Skills

Always use /frontend-design to design the user interface.

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4 (`@import "tailwindcss"` + `@theme inline` in
`app/globals.css`, no `tailwind.config.js`). Path alias `@/*` → repo root.

**This Next.js version has breaking changes vs. training data.** Before writing framework-specific code
(routing, data fetching, config, fonts, images, etc.), read the matching guide under
`node_modules/next/dist/docs/` (sections: `01-app`, `02-pages`, `03-architecture`, `04-community`) rather
than relying on prior Next.js knowledge.

### Game catalog vs. game detail vs. game player

These are three distinct routes, easy to confuse by name:

- `app/biblioteca/page.tsx` — catalog/library, filterable by `CATS`.
- `app/juego/[id]/page.tsx` — **server** component, game detail page (cover, description, leaderboard via
  `seededScores`). Links to `/jugar/[id]`.
- `app/jugar/[id]/page.tsx` — **client** component, the actual game player (`"use client"`). Renders the
  HUD (score/lives/level/pause) shared by every game, and swaps in per-game gameplay by `game.id`.

All game metadata (`GAMES`, `CATS`, `PLAYERS`, `seededScores`) lives in `app/data/games.ts` — still mock
data, no backend persistence for scores yet even though Supabase is wired up (see below).

### Per-game engines

Only `asteroides` has a real engine so far: `app/games/asteroides/engine.ts` (pure game-state simulation —
ship/asteroid physics, collisions, score/lives/level) driven by `app/games/asteroides/asteroids-canvas.tsx`
(`<canvas>` rendering + input, exposes an imperative handle for `restart`/`forceGameOver`, and reports an
`EngineSnapshot` up via `onSnapshot`). `app/jugar/[id]/page.tsx` special-cases `game.id === "asteroides"` to
mount `AsteroidsCanvas`; every other game still falls back to the old generic placeholder (a CSS arena with
a `setInterval` that adds a random score every 220ms — not real gameplay). New games should follow the
asteroides pattern: a standalone engine module + a canvas/DOM component that reports snapshots to the
shared player page, rather than extending the generic placeholder.

### Auth and session

`app/session-context.tsx` (`SessionProvider`/`useSession`) is an in-memory, client-only session (no
persistence across reloads) used to greet the user and prefill the score-save name in the player page.
`app/auth/page.tsx` is the login/register screen. Real auth is backed by Supabase (`lib/supabase/client.ts`,
`createSupabaseClient()` reads `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, throws if
missing) — see `specs/04-supabase-setup.md` for what's actually provisioned. Score persistence to Supabase
is not wired up yet; scores shown are still `seededScores()`, a deterministic LCG-based generator.

### Contact form

`app/api/contact/route.ts` sends email via Resend (`RESEND_API_KEY`, `CONTACT_TO_EMAIL` in `.env`), used by
the form on `app/acerca/page.tsx`.

### Visual language

Neon/CRT retro-arcade look: colors `cyan`/`magenta`/`green`/`yellow` (see `GameColor` in
`app/data/games.ts`), fonts Press Start 2P (`font-pixel`) / Courier Prime / JetBrains Mono, CRT scanline
effect applied via `.crt` / `.crt-screen` classes (see `app/jugar/[id]/page.tsx` for usage) defined in
`app/globals.css`.
