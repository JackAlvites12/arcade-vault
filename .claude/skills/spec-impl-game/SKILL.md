---
name: spec-impl-game
description: Variante de /spec-impl para specs que agregan un juego nuevo (los que salen de /add-game o de un spec de game-jam promovido). Reusa el flujo de /spec-impl tal cual (validar estado Aprobado, crear rama, implementar paso a paso) y, apenas terminan la implementación y los criterios de aceptación, dispara en secuencia los subagentes skin-designer y mobile-porter para cerrar la capa visual y responsive de lo que se acaba de sumar.
disable-model-invocation: true
argument-hint: <NN-spec-name>
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(cat:*), Bash(ls:*), Agent
---

# /spec-impl-game — implementador de specs de juego + cierre de skins y mobile

## Filosofía

Este comando no reimplementa `/spec-impl` — lo invoca en vivo con el tool `Skill` y le agrega
solo lo que le falta para el caso específico de "agregar un juego nuevo": un chequeo previo de que
el spec efectivamente agrega un juego, y una fase final que encadena `skin-designer` y
`mobile-porter` una vez terminada la implementación. Si la lógica de `/spec-impl` cambia, este
comando la hereda automáticamente por invocarla en vivo, no por tener una copia desactualizada —
mismo principio que ya aplica `/add-game` sobre `/spec`.

## Contexto de sesión

Estado del repo:
!`git status --short`

Rama actual:
!`git branch --show-current`

Specs disponibles en esta carpeta:
!`ls specs/ 2>/dev/null || echo "La carpeta specs/ no existe"`

---

## Instrucciones

Seguí las fases en orden estricto. No avances a la siguiente si la anterior no se resolvió
correctamente.

### Fase 0 — ¿Este spec agrega un juego?

El argumento recibido es: `$ARGUMENTS`

1. Localizá el archivo del spec en `specs/` con la misma lógica de búsqueda que la Fase 1 de
   `/spec-impl`: el usuario puede haber escrito el nombre completo (`08-implement-tetris-game`),
   solo el número (`08`) o solo el slug. Si no lo encontrás, mostrá los specs disponibles y pedí
   que corrija el nombre — no sigas.
2. Leé el contenido completo del spec y buscá señales de que agrega un juego nuevo:
   - Mención de `engine.ts` y de `-canvas.tsx` en el alcance o el plan de implementación.
   - Dependencia declarada de `06-asteroides` y/o `07-leaderboard-y-tabla-juegos` en el header
     (el patrón que `/add-game` siempre deja escrito).
3. **Si encontrás al menos una señal**, seguí directo a la Fase 1 sin pedir nada.
4. **Si no encontrás ninguna**, mostrá este aviso y esperá respuesta explícita antes de continuar:

   ```
   ⚠️ Este spec no parece agregar un juego nuevo (no menciona engine.ts/-canvas.tsx ni depende de
   06-asteroides/07-leaderboard-y-tabla-juegos). /spec-impl-game está pensado para specs de
   /add-game o de game-jam promovidos.

   ¿Continuar de todos modos? [y/N]
   ```

   - Si responde que no (o no responde afirmativo): sugerí correr `/spec-impl` a secas sobre ese
     spec y **detenete** ahí, sin invocar nada más.
   - Si responde que sí: seguí a la Fase 1.

### Fase 1 — Invocar /spec-impl

Invocá el tool `Skill` con `skill: "spec-impl"` y `args: $ARGUMENTS`. A partir de acá seguí sus
cuatro fases **tal cual están escritas** en su propio `SKILL.md` (búsqueda del spec, validación de
que el estado significa "Aprobado", creación y checkout de la rama `spec-NN-slug` según
`AutoCreateBranch`, implementación paso a paso con pausas para revisar cada diff). No reescribas
esa lógica acá — es la referencia autoritativa.

Si `/spec-impl` se frena en cualquiera de sus fases (estado no Aprobado, usuario no confirma la
rama, ambigüedad sin resolver), este comando termina ahí — nunca llega a la Fase 2 de abajo.

### Fase 2 — Enganche al cierre de la Fase 4 de /spec-impl

Esta instrucción queda activa durante toda la conversación, sin importar cuántos turnos tome la
implementación paso a paso: cuando llegues al cierre habitual de la Fase 4 de `/spec-impl` (el
último paso del plan implementado **y** el usuario confirmó que los criterios de aceptación
pasan), **no cortes ahí con el recordatorio genérico de `/spec-impl`**. Seguí directo a la Fase 3
de este comando, en el mismo turno.

### Fase 3 — Subagentes en secuencia (automático)

No pidas confirmación para arrancar esta fase — invocar `/spec-impl-game` en vez de `/spec-impl` es
en sí mismo la autorización del usuario para encadenar lo siguiente.

1. Anunciá: implementación y criterios de aceptación verificados; ahora se lanzan `skin-designer` y
   `mobile-porter` en secuencia para cerrar la capa visual y responsive de lo que se acaba de sumar.
2. Lanzá el tool `Agent` con `subagent_type: "skin-designer"` y `run_in_background: false` (tiene
   que terminar antes de seguir — nunca en paralelo con el siguiente). En el prompt, indicá
   explícitamente que audite e implemente las 3 skins **solo para el juego `<id>` recién
   agregado** — no le pidas ni le permitas tocar otros juegos, aunque el agente esté diseñado por
   defecto para auditar todos los juegos con motor real en cada corrida. Esta invocación es una
   excepción acotada a esa política general: se llama en el contexto puntual de cerrar un juego
   nuevo, no de una auditoría completa del sitio.
3. Recién cuando el paso anterior termina, lanzá el tool `Agent` con `subagent_type:
   "mobile-porter"`, también con `run_in_background: false`. En el prompt, acotá su auditoría
   únicamente a las rutas del juego nuevo (`/juego/<id>`, `/jugar/<id>`, y su card en
   `/biblioteca`/`/salon`) — no le pidas revisar el resto del sitio, aunque por defecto audite todo
   el sitio en cada corrida. Misma excepción acotada que en el paso anterior.
4. Mostrá un resumen combinado: qué auditó/tocó `skin-designer`, qué auditó/tocó `mobile-porter`.
5. Recordá los pendientes manuales que ya deja `/spec-impl` (actualizar el estado del spec a
   "Implementado", commit final) más la verificación visual en navegador que ninguno de los dos
   subagentes puede hacer por sí mismo (`mobile-porter` ya lo aclara en su propio reporte).

---

## Reglas duras

- **Nunca dupliques las cuatro fases de `/spec-impl`.** Se invocan en vivo vía el tool `Skill`, no
  se reescriben acá.
- **Nunca lances los dos subagentes en paralelo.** Secuencial: `skin-designer` primero, esperar a
  que termine, recién ahí `mobile-porter`.
- **Nunca llegues a la Fase 3** si la Fase 0 quedó sin confirmar, o si `/spec-impl` no cerró su
  Fase 4 con éxito.
- **Siempre restringí el alcance de los subagentes** al juego nuevo — aunque cada uno por defecto
  audite todos los juegos reales / todo el sitio y no tenga archivo de memoria que lo acote, en esta
  invocación puntual el prompt tiene que dejar explícito que el alcance es solo `<id>` (y sus rutas
  `/juego/<id>`, `/jugar/<id>`). Si igual reportan hallazgos fuera de ese alcance, anotalos en el
  resumen pero no dejes que los implementen en esta corrida.
- **Nunca escribas código vos mismo en este comando** — el motor, el canvas y el leaderboard los
  escribe `/spec-impl` siguiendo el plan del spec; la capa visual y responsive las escriben
  `skin-designer` y `mobile-porter`. Este comando solo orquesta.
