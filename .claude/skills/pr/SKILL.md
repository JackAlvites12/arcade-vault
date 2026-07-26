---
name: pr
description: Orquesta commits locales y/o la creación de un Pull Request en GitHub. Agrupa el diff actual en commits Conventional Commits por feature, y/o pushea y abre `gh pr create --web` para terminar de crear el PR. Modos: commit-only, pr-only, full.
disable-model-invocation: true
argument-hint: <commit-only|pr-only|full> [rama-base]
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(git remote:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(gh pr create:*), Bash(gh auth status:*)
---

# /pr — Orquestador de commits y Pull Requests

## Contexto de sesión

Estado del repo:
!`git status --short`

Rama actual:
!`git branch --show-current`

Remoto configurado:
!`git remote -v`

Diff resumido (staged + unstaged, contra HEAD):
!`git diff HEAD --stat`

Archivos sin trackear:
!`git status --porcelain | grep '^??' || echo "(ninguno)"`

---

## Instrucciones

Seguí las fases en orden estricto. No avances a la siguiente si la anterior no se resolvió correctamente.

---

### Fase 1 — Parsear argumentos

El argumento recibido es: `$ARGUMENTS`

1. **Primer token = modo.** Debe ser exactamente uno de: `commit-only`, `pr-only`, `full`. Si falta o no coincide con ninguno, mostrá esto y **detenete**:

   ```
   Uso: /pr <commit-only|pr-only|full> [rama-base]

   Modos:
     commit-only  → arma commits locales agrupados por feature (Conventional Commits), sin pushear ni crear PR.
     pr-only      → pushea los commits pendientes y abre `gh pr create --web`. Requiere working tree limpio.
     full         → commit-only + pr-only encadenados, con una sola confirmación.

   rama-base (opcional): rama destino del PR y contra la que se calcula el diff para título/cuerpo.
   Default: main. Solo aplica a pr-only/full; en commit-only se ignora.
   ```

2. **Segundo token opcional = rama base.** Solo relevante para `pr-only`/`full` (en `commit-only` se ignora, aunque venga informado).

   - Si no viene, la rama base es `main`.
   - Resolvé la rama (la que venga, o `main` por default) verificando que exista: primero local (`git rev-parse --verify --quiet <rama>`), si no, en el remoto (`git rev-parse --verify --quiet origin/<rama>`).
   - Si no resuelve en ninguno de los dos, mostrá el error y **detenete**:

     ```
     ❌ No encuentro la rama base "<rama>" ni localmente ni en origin.
     Verificá el nombre y volvé a correr /pr <modo> [rama-base].
     ```

3. Si todo resuelve, seguí a la Fase 2.

---

### Fase 2 — Validar estado del repo según el modo

1. **Cualquier modo:** si no hay remoto `origin` configurado (`git remote -v` sin salida, o sin una línea `origin`), mostrá esto y **detenete**:

   ```
   ❌ No hay remoto "origin" configurado en este repo. /pr necesita un remoto para pushear/crear PRs.
   ```

2. **Solo `pr-only`:** corré `git status --porcelain`. Si devuelve cualquier línea (staged, unstaged o untracked), hay cambios sin commitear. Mostrá esto y **detenete**:

   ```
   ❌ Hay cambios sin commitear en el working tree. `pr-only` no toca commits.

   Corré /pr commit-only para armarlos primero, o /pr full para hacer todo junto.
   ```

3. `commit-only` y `full` no tienen esta restricción (son ellos los que arman los commits). Si las validaciones pasan, seguí a la Fase 3.

---

### Fase 3 — Analizar el diff y agrupar en commits (`commit-only` / `full`)

Solo aplica a estos dos modos. Si el modo es `pr-only`, saltá directo a la Fase 4.

1. **Reuní el diff completo:**
   - Cambios staged: `git diff --cached`.
   - Cambios unstaged de archivos trackeados: `git diff`.
   - Archivos nuevos sin trackear: listalos con `git status --porcelain | grep '^??'` y leé su contenido (no aparecen en `git diff`).

2. **Agrupá por feature/intención, con juicio semántico sobre el diff completo** — no por carpeta ni por extensión de archivo. Un mismo commit puede tocar archivos en carpetas distintas si pertenecen a la misma feature (ej. un endpoint nuevo + su tipo TypeScript + la llamada desde el componente que lo consume). Reglas:
   - Todo archivo modificado, agregado o eliminado queda asignado a **exactamente un** grupo — ninguno se omite, ninguno se repite.
   - Si un archivo no tiene una feature clara asociada (ej. `package-lock.json`, config genérica), agrupalo en un commit tipo `chore` en vez de forzarle una separación artificial.

3. **Para cada grupo, armá un mensaje en formato Conventional Commits:** `<tipo>(<scope opcional>): <descripción en una línea>`. Tipos válidos: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `build`, `ci`, `perf`. Elegí el tipo según la naturaleza real del cambio (una feature nueva es `feat`, una corrección es `fix`, dependencias/config es `chore`, etc.).

4. **Los commits deben estar en idioma inglés** y ser concisos, claros y descriptivos. Evitá mensajes genéricos como "update files" o "fix stuff". Ejemplos de buenos mensajes:
   - `feat(auth): add Supabase client setup`
   - `chore(env): add Supabase env variables to .env.template`
   - `test(health): create endpoint test for Supabase connection`

   **No agregues trailer `Co-Authored-By` ni ninguna firma adicional** — el mensaje del commit es solo la línea Conventional Commits de arriba.

5. Guardá el resultado como la lista de commits propuestos (grupo → archivos → mensaje) para mostrarla en la Fase 5. Seguí a la Fase 4.

---

### Fase 4 — Armar el PR (`pr-only` / `full`)

Solo aplica a estos dos modos. Si el modo es `commit-only`, saltá directo a la Fase 5.

1. Calculá el diff acumulado entre la rama base resuelta (Fase 1) y `HEAD`: `git diff <rama-base>...HEAD --stat` para el resumen de archivos, y `git log <rama-base>..HEAD --oneline` para ver los commits incluidos en el rango.
   - En `full`, este cálculo asume los commits que decidiste en la Fase 3 (todavía no ejecutados): el título/cuerpo se arma sobre lo que ese plan va a dejar en `HEAD` una vez confirmado y ejecutado.

2. **Título del PR:** un mensaje Conventional Commits en inglés que resuma el conjunto (ej. `feat: add Supabase client and health check endpoint`). Si el rango tiene un solo commit, podés reusar directamente su mensaje como título.

3. **Cuerpo del PR:** arranca siempre con el encabezado `## Summary`, seguido de bullets (uno por commit/feature relevante) que resuman el "por qué" de cada uno, no el detalle línea por línea del diff:

   ```markdown
   ## Summary
   - <bullet 1>
   - <bullet 2>
   ```

4. Guardá rama base + título + cuerpo para mostrarlos en la Fase 5. Seguí a la Fase 5.

---

### Fase 5 — Plan único y confirmación

Antes de tocar git/gh, mostrá **todo** lo que vas a ejecutar de una sola vez, según el modo:

**`commit-only`:**

```
📋 Plan (commit-only)

Commit 1/N: <tipo(scope): descripción>
  - archivo/a.ts
  - archivo/b.ts

Commit 2/N: <tipo(scope): descripción>
  - archivo/c.ts

¿Confirmás? [y/N]
```

**`pr-only`:**

```
📋 Plan (pr-only)

Rama actual:  <rama>
Rama base:    <rama-base>
Push:         git push -u origin <rama>  (o "ya está al día" si no hace falta -u)

Título del PR: <título>

Cuerpo del PR:
## Summary
- <bullet 1>
- <bullet 2>

¿Confirmás? [y/N]
```

**`full`:** combiná ambos bloques (commits propuestos + push + PR) bajo un mismo `¿Confirmás? [y/N]`.

**Reglas:**

- Pedí **una única confirmación** por corrida, sea cual sea el modo. No hay confirmaciones parciales entre commitear y pushear/crear el PR.
- Esperá una respuesta explícita afirmativa ("sí", "dale", "y", "go", o equivalente). Cualquier otra cosa (vacío, "no", cancelar) **detiene todo** sin ejecutar ningún `git add`/`commit`/`push`/`gh pr create`.
- Si el usuario confirma, seguí a la Fase 6.

---

### Fase 6 — Ejecución

1. **Chequeo previo de "nada que hacer":**
   - Si el modo es `commit-only`/`full` y la Fase 3 no encontró ningún cambio para agrupar (working tree completamente limpio), avisá `No hay cambios sin commitear para armar commits.` y **detenete** sin ejecutar nada más.
   - Si el modo es `pr-only`/`full` y, luego de los commits (si aplica), `git log <rama-base>..HEAD` queda vacío, avisá `No hay commits nuevos respecto a <rama-base>. No hay nada para pushear ni ningún PR que crear.` y **detenete** sin pushear ni correr `gh pr create`.

2. **`commit-only` / `full` — crear los commits:** por cada grupo de la Fase 3, en el orden mostrado en el plan:
   - `git add <archivos del grupo>` — **nunca** `git add -A` ni `git add .`, solo los archivos específicos de ese grupo.
   - **Confirmá qué quedó staged antes de commitear:** corré `git diff --cached --name-only` y comparalo contra la lista de archivos esperada de ese grupo. Si aparece algún archivo de más (ej. quedó staged de un paso anterior o de otro grupo) o falta alguno, **detenete y avisá la discrepancia** en vez de commitear a ciegas — no asumas que el índice tiene justo lo que vos agregaste.
   - Recién si coincide exactamente, corré `git commit -m "<mensaje Conventional Commits del grupo>" -- <mismos archivos del grupo>` — **el pathspec va también en el `commit`, no solo en el `add`, y `-m` siempre antes del `--`**. Un `git commit -m` sin pathspec commitea *todo* lo que esté staged en ese momento, no solo lo que acabás de agregar; el pathspec en el commit es la segunda red de seguridad (la primera es el chequeo de `git diff --cached --name-only` de arriba) para que un archivo colado en el índice no rompa la separación por feature.

3. **`pr-only` / `full` — pushear:**
   - Si la rama actual no tiene upstream (`git rev-parse --abbrev-ref --symbolic-full-name @{u}` falla), corré `git push -u origin <rama-actual>`.
   - Si ya tiene upstream, corré `git push`.

4. **`pr-only` / `full` — crear el PR:** corré `gh pr create --web --base <rama-base> --title "<título>" --body "<cuerpo>"`. Esto abre el navegador con el formulario del PR precargado (rama base, título y cuerpo ya seteados); el usuario confirma la creación ahí.

5. **Resumen final:** mostrá qué se ejecutó realmente — lista de commits creados (con su mensaje), si se pusheó y a qué rama, y si se abrió el navegador para el PR.
