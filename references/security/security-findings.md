# Hallazgos de seguridad — Arcade Vault

Memoria del subagent `security-auditor`. Append-only salvo cambio de veredicto.
Severidad: `crítica` | `alta` | `media` | `baja`.
Veredicto: `pendiente` | `resuelto` | `aceptado-riesgo` | `no-aplica`.

| Fecha | Hallazgo | Área (DB/App) | Severidad | Veredicto | Referencia |
|---|---|---|---|---|---|
| 2026-08-06 | "Leaked Password Protection" deshabilitado (advisor `auth_leaked_password_protection`, WARN) — requiere plan Pro de Supabase, no disponible en el plan actual. | DB | media | aceptado-riesgo | specs/14-checklist-seguridad-basico.md L65, L82 |
| 2026-08-06 | `INSERT` público en `scores` sin validación server-side de rango de `score` ni longitud de `player_name` (RLS solo exige `user_id` propio o null; cualquiera con la anon key puede insertar puntuaciones arbitrarias para un `game_id` válido). | DB/App (`app/data/db.ts` `saveScore`) | media | aceptado-riesgo | specs/07-leaderboard-y-tabla-juegos.md L128, L138 |
| 2026-08-06 | `getTopScores(gameId, limit)` no valida `limit` (sin cota mín/máx) antes de pasarlo a `.limit()`. Hoy no es explotable porque todos los callers (`app/juego/[id]/page.tsx`, `app/salon/page.tsx`) usan el literal `10`, nunca input de usuario. | App (`app/data/db.ts`) | baja | pendiente | — |
| 2026-08-06 | `mapAuthError` en `app/auth/page.tsx` devuelve `error.message` crudo de Supabase en el caso `default` (mensajes no mapeados). No expone credenciales ni datos internos, pero rompe la intención de mensajes controlados del spec 13. | App (`app/auth/page.tsx`) | baja | pendiente | — |
