# 05 — Skill `/pr`: orquestador de commits y Pull Requests

> **Estado:** Implementado
> **Depende de:** Ninguno (skill de herramientas, no forma parte de la cadena de specs de la app)
> **Fecha:** 2026-07-26
> **Objetivo:** Crear la skill `/pr <commit-only|pr-only|full> [rama-base]`, que arma commits locales agrupados por feature a partir del diff y, en los modos que lo requieran, pushea la rama y abre `gh pr create --web` para terminar de crear el PR, siempre bajo un único plan de confirmación por corrida.

## Alcance

**Incluye:**

- Nueva skill en `.claude/skills/pr/SKILL.md`, con el mismo patrón de frontmatter que `spec-impl` (`name: pr`, `argument-hint: <commit-only|pr-only|full> [rama-base]`, `disable-model-invocation: true`, `allowed-tools` acotado a los comandos de git/gh que necesita: status, diff, log, branch, add, commit, push, y `gh pr create`/`gh auth status`).
- **`/pr commit-only`**: lee el diff completo (staged + unstaged + archivos nuevos sin trackear), propone N commits agrupados por feature usando juicio semántico sobre el diff (no por carpeta/extensión), cada uno con mensaje en formato **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, etc., con scope opcional entre paréntesis cuando aporte claridad). Muestra el plan completo (grupos, archivos de cada uno, mensaje propuesto) y pide **una sola confirmación** antes de correr cualquier `git add`/`git commit`.
- **`/pr pr-only`**: valida que el working tree no tenga cambios sin commitear (si los hay, se detiene — ver más abajo). Si está limpio, pushea la rama actual (con `-u origin <rama>` si no tiene upstream) y arma título (Conventional Commits, ej. `feat: agregar formulario de contacto`) y cuerpo del PR a partir del diff acumulado entre la rama base y `HEAD`. El cuerpo siempre arranca con el encabezado `## Summary` seguido de bullets del resumen (mismo formato que ya usa Claude Code al crear PRs). Corre `gh pr create --web --base <rama-base> --title "<título>" --body "<cuerpo>"`.
- **`/pr full`**: encadena el flujo de `commit-only` (arma y confirma el plan de commits) y, dentro de la misma confirmación, el flujo de `pr-only` (push + `gh pr create --web`) — sin pausa intermedia entre crear los commits y pushear/crear el PR.
- Segundo argumento opcional `[rama-base]`: define la rama destino del PR (y contra qué rama se calcula el diff para título/cuerpo). Si se omite, `main`. Solo aplica a `pr-only`/`full`; en `commit-only` se ignora.
- Si no hay commits nuevos respecto a la rama base (nada para pushear) en `pr-only`/`full`, la skill no pushea ni intenta crear PR: se detiene y lo informa explícitamente.
- Un único plan mostrado antes de ejecutar, en todos los modos: lista de commits propuestos (o resumen de que no aplica en `pr-only`), rama base resuelta, y — cuando aplique — título/cuerpo del PR generado. Una sola confirmación por corrida ejecuta todo lo que corresponda al modo.

**No incluye (fuera de este spec):**

- Squash/rebase de commits existentes, edición de PRs ya creados, reviewers/labels/plantillas de PR (no hay plantilla en `.github/` hoy), draft PRs.
- Cualquier relación con el flujo `/spec`/`/spec-impl` — es una skill de propósito general, no lee `specs/` ni valida estado de ningún spec.
- Rollback automático de commits ya creados si el usuario cancela a mitad de la ejecución de `full` (se detiene donde esté, no deshace lo ya hecho).
- Verificación de CI/checks antes de crear el PR.
- PRs entre ramas que no sean la rama actual vs. la rama base indicada (no soporta operar sobre otra rama que no sea la activa).

## Modelo de datos

Este spec no introduce estructuras de datos nuevas ni persistencia. No hay tablas, tipos de dominio ni configuración versionada — la skill opera sobre el estado de git/GitHub en cada corrida (diff, commits, PR), sin guardar nada entre invocaciones.

## Plan de implementación

1. **Esqueleto de la skill.** Crear `.claude/skills/pr/SKILL.md` con frontmatter (`name: pr`, `description`, `disable-model-invocation: true`, `argument-hint: <commit-only|pr-only|full> [rama-base]`, `allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(gh pr create:*), Bash(gh auth status:*)`) y la sección de contexto de sesión (mismo patrón que `spec-impl`: `git status --short`, `git branch --show-current`, diff resumido, remoto `origin`).

2. **Parseo de argumentos.** `$ARGUMENTS`: primer token = modo (`commit-only`/`pr-only`/`full`); si no coincide con ninguno, mostrar uso correcto y detenerse. Segundo token opcional = rama base; si no se puede resolver ni local ni en `origin`, avisar y detenerse. Si se omite, rama base = `main`.

3. **Validación de estado según modo.** `pr-only`: si hay cambios sin commitear (staged, unstaged o untracked), detenerse y sugerir `commit-only` o `full`. Cualquier modo: si no hay remoto `origin` configurado, detenerse.

4. **Análisis y agrupación (`commit-only`/`full`).** Leer el diff completo (staged + unstaged + untracked). Proponer N grupos lógicos por feature/intención (juicio semántico sobre el diff completo, no por carpeta/extensión fija). Un mensaje **Conventional Commits** por grupo (`feat:`, `fix:`, `chore:`, `docs:`, etc., scope opcional).

5. **Armado del PR (`pr-only`/`full`).** Calcular el diff acumulado entre la rama base resuelta y `HEAD`. Armar título en formato Conventional Commits y cuerpo que arranca con `## Summary` seguido de bullets del resumen.

6. **Plan único + confirmación.** Mostrar todo lo que se va a ejecutar (commits propuestos con sus archivos, y/o rama base + título/cuerpo del PR) y pedir **una sola confirmación** antes de tocar git/gh.

7. **Ejecución.** `commit-only`/`full`: `git add` de los archivos de cada grupo (nunca `-A`/`.`) + `git commit -m` por grupo, en orden. `pr-only`/`full`: `git push` (con `-u origin <rama-actual>` si falta upstream) y luego `gh pr create --web --base <rama-base> --title "<título>" --body "<cuerpo>"`.

8. **Verificación manual.** Con cambios reales mezclando ≥2 features: `/pr commit-only` arma ≥2 commits separados y pide confirmación antes de commitear. `/pr full` crea los commits, pushea, y abre el navegador con el formulario de PR precargado (título/cuerpo/rama base correctos). `/pr pr-only` con working tree sucio se detiene sin pushear ni crear PR. `/pr full` (o `pr-only`) sin commits nuevos respecto a la rama base no pushea ni abre el navegador, y lo informa.

## Criterios de aceptación

- [x] Existe `.claude/skills/pr/SKILL.md` con frontmatter válido (`name: pr`, `argument-hint: <commit-only|pr-only|full> [rama-base]`, `disable-model-invocation: true`, `allowed-tools` acotado a los comandos git/gh listados en el plan).
- [x] `/pr commit-only` con cambios de ≥2 features distintas en el working tree propone ≥2 commits separados, cada uno con mensaje en formato Conventional Commits, y no ejecuta ningún `git add`/`git commit` hasta que el usuario confirma el plan mostrado.
- [x] `/pr commit-only`/`full` nunca usan `git add -A` ni `git add .` — solo agregan los archivos específicos de cada grupo propuesto.
- [x] `/pr` con un primer argumento que no sea `commit-only`, `pr-only` o `full` muestra el uso correcto y se detiene sin tocar git/gh.
- [x] `/pr pr-only` con working tree sucio (cambios sin commitear) se detiene sin pushear ni crear PR, y sugiere `commit-only` o `full`.
- [x] `/pr pr-only` con commits locales pendientes de push y working tree limpio: pushea la rama actual y corre `gh pr create --web` con `--base main` por defecto.
- [x] `/pr full feat/01-cong` usa `feat/01-cong` como rama base tanto para el diff que arma título/cuerpo del PR como para `--base` en `gh pr create --web`.
- [x] El cuerpo del PR generado empieza con el encabezado `## Summary` seguido de bullets.
- [x] `/pr full` ejecuta commits agrupados, push y `gh pr create --web` con una sola confirmación del usuario (sin pausa intermedia entre commitear y pushear/crear el PR).
- [x] Si no hay commits nuevos respecto a la rama base, `/pr pr-only`/`full` no pushean ni intentan crear PR, e informan explícitamente que no hay nada que enviar.
- [x] La skill no lee `specs/` ni valida estado de ningún spec.

## Decisiones tomadas y descartadas

- **Argumento explícito de modo** (`commit-only`/`pr-only`/`full`) en vez de detección automática del estado del repo. Motivo: pedido explícito — evita ambigüedad cuando el repo tiene a la vez cambios sin commitear y commits sin pushear.
- **Agrupación de commits por juicio semántico del diff completo**, no por regla determinística de carpeta/extensión. Motivo: pedido explícito del usuario, prioriza que cada commit represente una feature coherente aunque toque varias carpetas.
- **Mensajes de commit en formato Conventional Commits.** Motivo: pedido explícito del usuario.
- **Cuerpo del PR con encabezado `## Summary`.** Motivo: pedido explícito del usuario; mantiene el mismo formato que ya usa Claude Code al crear PRs en este entorno.
- **Una sola confirmación por corrida**, incluso en `full` (commits + push + PR sin pausa intermedia). Motivo: pedido explícito del usuario.
- **Creación del PR vía `gh pr create --web`** (el usuario termina de confirmar en el navegador) en vez de crearlo directo por CLI. Motivo: pedido explícito — deja al usuario el último vistazo/edición del PR en GitHub antes de que quede creado, y satisface el pedido de que se abra la pestaña del navegador con la rama base ya seteada.
- **`pr-only` se detiene ante cambios sin commitear**, en vez de ignorarlos o commitearlos automáticamente. Motivo: pedido explícito — evita que un modo pensado solo para "PR" termine tomando decisiones de commit por su cuenta.
- **Segundo argumento opcional para la rama base**, default `main`. Motivo: pedido explícito, cubre PRs contra ramas de feature intermedias (ej. `feat/01-cong`) sin necesitar un flag separado.
- **Sin relación con el flujo `/spec`/`/spec-impl`.** Motivo: pedido explícito del usuario — skill de propósito general, no atada a specs.
- **Descartado:** detección automática de modo, agrupación por carpeta/extensión, confirmaciones múltiples por acción riesgosa, creación directa vía `gh pr create` (CLI) sin paso por navegador. Todas evaluadas y descartadas a favor de las opciones de arriba.

## Riesgos identificados

| Riesgo                                                                                                     | Mitigación                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| La agrupación semántica del diff no es determinística y puede variar entre corridas.                       | El plan completo (grupos + archivos + mensajes) se muestra siempre antes de cualquier `git add`/`commit`; el usuario cancela si no le sirve. |
| `gh pr create --web` abre el navegador pero no garantiza que el usuario termine de crear el PR (puede cerrar la pestaña). | Aceptable: el push ya deja la rama disponible en remoto; se puede re-correr `gh pr create --web` manualmente o `/pr pr-only` de nuevo. |
| Rama base mal escrita en el segundo argumento generaría un PR contra la rama equivocada.                    | El plan mostrado antes de confirmar siempre incluye la rama base resuelta explícitamente, dando la chance de cancelar.               |
