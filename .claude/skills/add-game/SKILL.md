---
name: add-game
description: Diseña un spec para un juego nuevo con motor real e integración de leaderboard real (Supabase), portado desde references/started-games/ o construido desde cero. Hace preguntas aclaratorias y arma specs/NN-nombre.md siguiendo el patrón de los specs 06-asteroides y 07-leaderboard-y-tabla-juegos. No implementa código — eso lo hace /spec-impl después.
disable-model-invocation: true
argument-hint: "[carpeta-de-referencia-o-nombre-del-juego]"
---

# /add-game — Diseñador de specs para juegos nuevos

Esta skill ayuda a producir un spec listo para implementar cuando se agrega un juego nuevo a Arcade Vault (motor real + integración en el reproductor + leaderboard real de Supabase). **Acá no se escribe código, y tampoco se reimplementa la mecánica de armar specs.** El trabajo propio de esta skill es reunir el conocimiento de dominio que `/spec` no tiene (el patrón motor+canvas+leaderboard de los specs 06+07, y las preguntas específicas de "qué juego es este") — la redacción del spec en sí (secciones, numeración, slug, guardado del archivo) se delega en la skill `/spec` ya existente, invocada como referencia directa.

## Filosofía

Todo juego "completo" en esta plataforma sigue el mismo patrón, ya probado dos veces (spec 06 y spec 07 combinados): un motor TypeScript aislado + un componente canvas cliente + integración en el reproductor + leaderboard real conectado a Supabase desde el día uno. Esta skill existe para no tener que re-derivar ese patrón a mano cada vez, y para no duplicar la lógica de `/spec` (fases de preguntas, construcción sección por sección, numeración, `.spec-config.yml`) — esa lógica ya existe y funciona, `/add-game` solo le inyecta el contexto de dominio y después la invoca.

## Flujo del comando

- Seguí las fases en orden. **No te saltees fases.**
- Tus respuestas deben estar en español, siguiendo la instrucción del proyecto (`CLAUDE.md` → "Idioma").

### Fase 1 — Entender el contexto

Antes de preguntar sobre el juego, asegurate de tener contexto del proyecto:

1. Leé `CLAUDE.md` (y `AGENTS.md` si existe) para refrescar las convenciones del proyecto.
2. Listá `specs/` para calcular el siguiente `NN` disponible.
3. Leé **siempre**, sin importar la fecha, `specs/06-asteroides.md` y `specs/07-leaderboard-y-tabla-juegos.md` completos. No son "los dos specs más recientes" a modo de convención — son la referencia arquitectónica obligatoria de esta skill: 06 define el patrón motor+canvas, 07 define la infraestructura de datos (`games`/`scores` en Supabase, `app/data/db.ts`) que ya existe y no hay que recrear.
4. Leé `app/games/asteroides/engine.ts` y `app/games/asteroides/asteroids-canvas.tsx` como plantilla de código a replicar: la estructura de clases del motor (`update`/`draw`/flag `dead`), los tipos `EngineState`/`EngineSnapshot`/`EngineInput`, el `forwardRef` con `restart()`/`forceGameOver()`, el patrón de `useEffect` único de montaje a prueba de Strict Mode, el teclado scopeado al componente, y el resize con `devicePixelRatio`/`ResizeObserver`.
5. Leé `app/data/db.ts` para confirmar la firma exacta de `getGames`/`getGame`/`getTopScores`/`saveScore` — el spec nuevo los reusa tal cual, no los reinventa.
6. Listá `references/started-games/` para saber qué carpetas hay disponibles para portar (hoy: `02-asteroids` ya portado como referencia, y las que no estén portadas todavía).

Si `$ARGUMENTS` viene vacío, arrancá directo con las preguntas de la Fase 2. Si trae un valor, usalo como pista inicial (ej. nombre de una carpeta de `references/started-games/` o un nombre de juego) pero confirmá igual todo en la Fase 2 — no asumas.

### Fase 2 — Aclarar con preguntas

Preguntá en bloques de 3 a 5 a la vez, no una por una. Esperá respuesta antes de seguir.

**Bloque 1 — Origen y mecánica:**

1. **Origen:** ¿el juego se porta desde una carpeta de `references/started-games/` (¿cuál de las disponibles?) o se construye desde cero? Si es desde cero, describí en la misma respuesta: mecánica principal, condición de victoria/derrota, y cómo se calcula el puntaje.
2. **Controles:** ¿solo teclado, o mixto teclado+mouse (como el prototipo de arkanoid)? Esto define la forma de `EngineInput`.
3. **Assets adicionales:** si la referencia trae sonidos o sprites (ej. arkanoid trae `assets/spritesheet.js` y `assets/sounds/*.mp3`), ¿se portan en este spec o quedan fuera de alcance? Recomendación: fuera de alcance, igual que asteroides no tiene sonido — mantiene el spec enfocado en motor+canvas+leaderboard.

**Bloque 2 — Metadata de catálogo** (todos estos van directo a la fila nueva de la tabla `games`):

4. **Identidad:** `id` (slug, ej. `tetris`), `title`, `short` (una frase), `long` (dos o tres frases).
5. **Clasificación:** `cat` (`ARCADE`/`PUZZLE`/`SHOOTER`/`VERSUS`) y `color` (`cyan`/`magenta`/`green`/`yellow`).
6. **Portada:** ¿reusar una clase `.cover-*` ya existente en `app/globals.css`, o definir una nueva? Si es nueva, describí el estilo visual esperado.
7. **Relleno:** `best`/`plays` de arranque (valores estáticos, no se recalculan desde `scores` — mismo criterio que asteroides).

No preguntes por leaderboard real vs. mock — **siempre es real** para los juegos que arma esta skill (decisión ya tomada, generaliza lo que spec 07 dejó solo para asteroides). Documentalo directo en la sección de decisiones del spec.

**Cuándo parar de preguntar:** cuando puedas responder sin asumir nada:

1. ¿Qué archivos van a aparecer o cambiar?
2. ¿Cuál es el primer paso ejecutable y cuál el último?
3. ¿Cómo se verifica que el juego quedó bien integrado (motor, HUD, leaderboard)?

Si todavía no podés responder alguna, seguí preguntando.

### Fase 3 — Invocar `/spec` como referencia para redactar el spec

Esta skill **no arma las secciones del spec por su cuenta ni escribe el archivo**. En este punto ya tenés todo el contexto de dominio (Fase 1) y las respuestas específicas del juego (Fase 2) resueltas en la conversación. Ahora:

1. **Mostrá un resumen visible** de todo lo reunido antes de invocar nada — origen (referencia portada o desde cero), mecánica/controles/assets, metadata de catálogo (`id`/`title`/`short`/`long`/`cat`/`color`/`cover`/`best`/`plays`), y las decisiones ya cerradas que no hay que volver a preguntar:
   - Dependencias obligatorias: `06-asteroides` (patrón motor+canvas) y `07-leaderboard-y-tabla-juegos` (infraestructura Supabase ya existente, no se recrea).
   - Leaderboard real desde el día uno (nunca `seededScores` como destino final para este juego).
   - Archivos que va a tocar el plan: fila nueva en `games` (Supabase), `app/games/<id>/engine.ts`, `app/games/<id>/<id>-canvas.tsx`, `app/jugar/[id]/jugar-client.tsx`, `app/juego/[id]/page.tsx`, `app/salon/page.tsx`/`salon-client.tsx`.
   Este resumen queda en el contexto de la conversación — es lo que evita que `/spec` tenga que volver a preguntar lo mismo.
2. **Armá el objetivo de una sola frase** que le vas a pasar como argumento, ej.: `"Agregar el juego <Título>, portado desde references/started-games/<carpeta> con motor real y leaderboard real de Supabase"` (o `"... construido desde cero ..."` si no hay referencia).
3. **Invocá la skill `spec`** con el tool `Skill` (`skill: "spec"`, `args: <objetivo de una frase>`). A partir de acá, seguí el flujo de `/spec` **tal cual está escrito en su propio `SKILL.md`** (sus cuatro fases: contexto, preguntas, secciones, guardado) — es la referencia autoritativa de cómo se construye y guarda un spec en este proyecto. No reescribas esa lógica acá.
4. **Mientras seguís el flujo de `/spec`, aplicá estos ajustes obligatorios** (son lo único que esta skill le agrega):
   - **No repreguntes** lo que ya está resuelto en el resumen del paso 1 (origen, mecánica, controles, assets, metadata) — usalo directo al completar las secciones que correspondan de `/spec`.
   - En el **header**, la dependencia declarada debe incluir explícitamente `06-asteroides` y `07-leaderboard-y-tabla-juegos`.
   - En **Alcance → Incluye**, asegurate de que queden los ítems concretos ya conocidos (fila en `games`, `engine.ts`, `<id>-canvas.tsx`, integración en `jugar-client.tsx`, extensión del leaderboard real en `juego/[id]` y `salón`) — no dejes que `/spec` los redacte de forma más genérica o los omita.
   - En **Criterios de aceptación**, exigí que quede un ítem explícito del tipo "el leaderboard de `<id>` usa `getTopScores`/`saveScore` real, no `seededScores`".
   - En **Decisiones tomadas y descartadas**, dejá constancia de que el patrón motor+canvas de asteroides se sigue al pie de la letra y de que el leaderboard real es una decisión ya cerrada (generalización de spec 07), no algo a debatir en este spec.
5. La Fase 4 de `/spec` (numeración, slug, confirmación, guardado en `specs/NN-slug.md`, estado `Borrador`, cierre sin proponer implementar) se ejecuta exactamente como `/spec` la define — no hay una versión propia de esta skill para ese paso.

## Reglas duras

- **Nunca escribas código durante este comando.** Solo el `.md` del spec al final, y ese archivo lo escribe el flujo de `/spec`, no esta skill directamente.
- **Nunca dupliques la mecánica de `/spec`** (preguntas genéricas, construcción sección por sección, numeración, `.spec-config.yml`). Si algo de eso cambia en `/spec`, `/add-game` debe seguir heredándolo automáticamente por invocarla en vivo, no por tener una copia desactualizada.
- **Nunca propongas implementar el spec después de guardarlo.** El trabajo termina cuando se escribe el archivo.
- **Nunca asumas decisiones que el usuario no confirmó** en la Fase 2 de esta skill.
- **El leaderboard siempre es real** (Supabase, vía `app/data/db.ts`) para los juegos que arma esta skill — nunca dejes que `/spec` proponga `seededScores` como destino final; ese mock solo aplica a los juegos que no pasaron por esta skill.
- **Nunca reinventes la infraestructura de spec 07** (tablas `games`/`scores`, `app/data/db.ts`) — el spec nuevo la reusa, no la recrea.

## Argumentos

Si el usuario invocó `/add-game 03-tetris`, usá `03-tetris` como pista de que el origen probablemente sea esa carpeta de `references/started-games/`, pero confirmá igual en la Fase 2 — no asumas que es la respuesta final. Ese valor **no** se pasa tal cual a `/spec`; el argumento que recibe `/spec` es el objetivo de una sola frase armado en la Fase 3.

Si invocó `/add-game` sin argumentos, arrancá directo con el Bloque 1 de preguntas de la Fase 2.
