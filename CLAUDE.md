# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## About the project

Arcade Vault (`README.md`) is a Spanish-language retro arcade platform: play games online and compete on
score leaderboards. The repo is currently a fresh `create-next-app` scaffold — `app/` only has the default
boilerplate page — but `references/templates/` (already unzipped from the original
`iISLvhOSlu40WkgeVXdW_resources.zip`, since deleted) contains the actual product spec as a working
prototype. Treat it as the design/behavior reference when building out the real Next.js app:

- `Arcade Vault.html` — standalone shell that loads React 18 + Babel standalone from CDN (no build step) and
  the `.jsx` files below via `<script type="text/babel">`. This is a throwaway prototyping harness, not a
  pattern to replicate in the Next.js app (use real App Router routes/components instead of the hash-based
  `route` state in `app.jsx`).
- `data.jsx` — mock domain data: `GAMES` (id, title, cat, cover, color, best score, plays), `CATS` (chip
  filters — `TODOS` plus ARCADE/PUZZLE/SHOOTER/VERSUS), `PLAYERS`, and `seededScores()`, a
  linear-congruential PRNG that fabricates a full leaderboard (ranks, names, scores, dates) from a numeric
  seed — there's no real score persistence to reference.
- `nav.jsx` / `app.jsx` — top nav and the route switch: `biblioteca` (library/catalog) → `detalle` (game
  detail) → `player` (game player) → `salon` (hall of fame / leaderboard), plus `auth` (login/register).
- `biblioteca.jsx`, `detalle.jsx`, `reproductor.jsx`, `salon.jsx`, `auth.jsx` — one file per screen.
- `styles.css` — the neon/CRT visual language (colors, fonts: Press Start 2P, Courier Prime, JetBrains Mono).

None of the 8 games in `GAMES` have real gameplay: `reproductor.jsx` (`GamePlayer`) is a single generic
player shared by every game — a CSS arena with floating divs plus a `setInterval` that adds a random score
every 220ms. There is no per-game logic anywhere in the prototype to port; actual game engines/rules for
each title need to be designed and built from scratch.

Auth state and scores in the prototype are stored in `localStorage` only (`av_user`, `av_scores`) — there is
no backend yet in this repo. `README.md` also names a spec-driven workflow for this project (Klerith's
`fernando-skills` `/spec` and `/spec-impl` commands via `npx skills@latest add Klerith/fernando-skills`),
but that skills package is not installed in this environment yet.


## Skills

Usa siempre /frontend-design para diseñar la interfaz de usuario.

## Architecture notes

- Next.js 16 App Router (`app/` directory), React 19, TypeScript, Tailwind CSS v4 (imported directly in
  `app/globals.css` via `@import "tailwindcss"` and `@theme inline` — no `tailwind.config.js`).
- Path alias `@/*` → repo root (`tsconfig.json`).
- **This Next.js version has breaking changes vs. training data.** Before writing framework-specific code
  (routing, data fetching, config, fonts, images, etc.), read the matching guide under
  `node_modules/next/dist/docs/` (sections: `01-app`, `02-pages`, `03-architecture`, `04-community`) rather
  than relying on prior Next.js knowledge.
