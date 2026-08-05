# 13 — Autenticación real con Supabase

> **Estado:** Implementado
> **Depende de:** [04-supabase-setup](04-supabase-setup.md) (cliente Supabase base), [07-leaderboard-y-tabla-juegos](07-leaderboard-y-tabla-juegos.md) (tabla `scores`, `saveScore`)
> **Fecha:** 2026-08-04
> **Objetivo:** Reemplazar la sesión en memoria actual por autenticación real con Supabase Auth (email/contraseña con confirmación de email, Google y Github), persistente entre recargas, que vincula los scores guardados al usuario logueado y redirige fuera de `/auth` cuando ya hay sesión activa.

## Alcance

**Incluye:**

- Supabase Auth real: email/contraseña (con confirmación de email obligatoria antes de poder loguear) + OAuth Google + OAuth Github.
- `app/auth/page.tsx` conectado a `supabase.auth.signInWithPassword`, `signUp` y `signInWithOAuth` (reemplaza el `login()` simulado actual).
- `app/auth/callback/page.tsx` (cliente): llama `exchangeCodeForSession` tras volver de Google/Github y redirige a `/biblioteca`.
- `app/session-context.tsx`: reemplaza el estado en memoria por el estado real de Supabase (`getSession` + `onAuthStateChange`), manteniendo la misma interfaz (`user`, `signOut`) para no tocar `Nav`/`jugar-client` más de lo necesario.
- Persistencia de sesión vía el cliente `@supabase/supabase-js` existente (guarda en `localStorage`, sobrevive reload) — sin `@supabase/ssr`, sin cookies, sin `middleware.ts`.
- Redirect automático fuera de `/auth` hacia `/biblioteca` cuando ya hay sesión activa.
- Modo invitado (`playAsGuest`) se mantiene intacto, sin cambios.
- Columna nueva `scores.user_id` (uuid, nullable, FK a `auth.users(id)` on delete set null), seteada al guardar score si hay sesión activa.
- Campo de nombre en el formulario de guardar score (`jugar-client.tsx`): autocompletado y bloqueado (no editable) cuando hay sesión, usando el nombre del provider social (Google/Github) o `user_metadata.name` para email/contraseña; sigue editable en modo invitado.
- Mensajes de error específicos simples: credenciales inválidas, correo ya registrado, correo sin confirmar.
- Mensaje de "revisa tu correo para confirmar tu cuenta" tras registrarse con email/contraseña.
- Ajuste de política RLS de `scores` para permitir el insert incluyendo `user_id` cuando corresponde.

**Fuera de alcance:**

- Recuperar contraseña ("olvidé mi contraseña").
- Rutas protegidas: ninguna ruta queda bloqueada salvo `/auth` estando logueado; el resto del sitio sigue público igual que hoy.
- `@supabase/ssr`, cookies de sesión o `middleware.ts` — descartado por decisión explícita en este spec.
- Creación/configuración de las apps OAuth de Google y Github en el dashboard de Supabase (client id/secret) — la hace el usuario manualmente, fuera del código.
- Rediseño de `Nav.tsx` — el botón "usuario ▾" sigue haciendo logout instantáneo al click, igual que hoy.
- Retro-vinculación de scores ya guardados antes de este spec (quedan con `user_id` null).
- Cambios a `getGames`/`getGame`/`getTopScores` — siguen sin auth, RLS de lectura pública intacta.
- Roles, permisos o niveles de usuario (admin, etc.).
- Vinculación de cuentas con el mismo email entre distintos métodos de login — comportamiento default de Supabase, sin personalizar.

## Modelo de datos

**Migración Supabase** (tabla `scores`, vía `apply_migration`):

```sql
alter table public.scores
  add column user_id uuid references auth.users(id) on delete set null;
```

RLS de `scores`: se ajusta la policy de insert existente para aceptar `user_id` (propio `auth.uid()` o `null` en modo invitado) sin abrir escritura arbitraria sobre `user_id` de otro usuario.

**`app/session-context.tsx`** — pasa de estado en memoria a espejo del estado real de Supabase Auth:

```typescript
export interface SessionUser {
  id: string; // auth.users.id
  name: string; // ver decisión (c): provider social > user_metadata.name
}

interface SessionContextValue {
  user: SessionUser | null;
  signOut: () => void;
}
```

Se elimina `login()` del contexto: la sesión ya no se setea a mano desde `auth/page.tsx`, se deriva sola vía `supabase.auth.onAuthStateChange` + `getSession()` al montar el provider.

**`app/data/db.ts`** — `saveScore` gana un cuarto parámetro opcional:

```typescript
export async function saveScore(
  gameId: string,
  playerName: string,
  score: number,
  userId?: string,
): Promise<void>;
```

**`app/auth/page.tsx`** — helper local para mensajes de error:

```typescript
function mapAuthError(error: AuthError): string;
// "Invalid login credentials" → "Credenciales inválidas"
// "User already registered" → "Ese correo ya está registrado"
// "Email not confirmed" → "Confirma tu correo antes de iniciar sesión"
// default → error.message
```

## Plan de implementación

1. **Migración de base de datos.** Agregar `scores.user_id` (uuid, nullable, FK a `auth.users`) y ajustar la policy RLS de insert en `scores` para aceptar `user_id` propio o `null`. Nada más cambia todavía; el sitio sigue funcionando igual.
2. **Configuración manual de providers OAuth.** Habilitar Google y Github en el dashboard de Supabase Auth con las credenciales que irá pasando el usuario. Paso externo, sin código.
3. **`app/session-context.tsx`.** Reescribir para reflejar la sesión real de Supabase (`getSession` + `onAuthStateChange`), exponer `user`/`signOut`, eliminar `login()`. Agregar el helper de nombre a mostrar (provider social > `user_metadata.name`).
4. **`app/auth/page.tsx`.** Conectar los formularios a `signInWithPassword`, `signUp` y `signInWithOAuth`; agregar `mapAuthError`, el mensaje de "revisa tu correo" tras registro, y el redirect a `/biblioteca` si ya hay sesión activa o tras login/registro exitoso.
5. **`app/auth/callback/page.tsx`.** Página cliente nueva: `exchangeCodeForSession` al volver de Google/Github, redirect a `/biblioteca`.
6. **`app/data/db.ts`.** `saveScore` acepta `userId` opcional y lo incluye en el insert.
7. **`app/jugar/[id]/jugar-client.tsx`.** Autocompletar y bloquear el campo de nombre cuando hay sesión; pasar `user.id` a `saveScore` cuando corresponde.
8. **Verificación manual end-to-end.** Registro por email (confirmar desde la bandeja), login con email confirmado y sin confirmar, login Google, login Github, guardar score logueado (`user_id` seteado, nombre bloqueado) e invitado (`user_id` null, nombre editable), reload mantiene sesión, `/auth` redirige si ya hay sesión, logout limpia la sesión.

## Criterios de aceptación

- [x] Registrarse con email/contraseña crea el usuario en Supabase Auth y muestra "revisa tu correo para confirmar tu cuenta", sin loguear de inmediato.
- [x] Intentar loguear con un correo sin confirmar muestra "Confirma tu correo antes de iniciar sesión" y no crea sesión.
- [x] Tras confirmar el correo desde el mail, el login con email/contraseña funciona y redirige a `/biblioteca`.
- [x] Login con credenciales inválidas muestra "Credenciales inválidas" y no crea sesión.
- [x] Registrarse con un correo ya existente muestra "Ese correo ya está registrado".
- [x] Login con Google redirige, vuelve por `/auth/callback`, y deja sesión activa en `/biblioteca`.
- [x] Login con Github redirige, vuelve por `/auth/callback`, y deja sesión activa en `/biblioteca`.
- [x] La sesión persiste tras recargar la página (F5) sin pedir login de nuevo.
- [x] Entrar a `/auth` estando logueado redirige automáticamente a `/biblioteca`.
- [x] Cerrar sesión (botón "usuario ▾" en `Nav`) limpia la sesión y vuelve a mostrar "Iniciar Sesión".
- [x] Modo invitado (`playAsGuest`) sigue funcionando exactamente igual que antes.
- [x] Guardar score logueado: el campo de nombre aparece autocompletado y bloqueado, y la fila insertada en `scores` tiene `user_id` igual al id del usuario.
- [x] Guardar score en modo invitado: el campo de nombre sigue editable, y la fila insertada tiene `user_id` null.
- [x] Ninguna ruta (`/`, `/biblioteca`, `/salon`, `/juego/[id]`, `/jugar/[id]`, `/acerca`) queda bloqueada por falta de sesión.
- [x] `getGames`, `getGame`, `getTopScores` siguen funcionando sin cambio de comportamiento.
- [x] Los scores guardados antes de este spec siguen visibles en el leaderboard, con `user_id` null.

## Decisiones tomadas y descartadas

- **Email/contraseña + Google + Github**, sin magic link. Motivo: pedido explícito.
- **Confirmación de email obligatoria** (comportamiento default de Supabase). Motivo: pedido explícito, evita cuentas con correos falsos.
- **Persistencia vía el cliente `@supabase/supabase-js` plano (localStorage)**, sin `@supabase/ssr`, cookies ni `middleware.ts`. Motivo: pedido explícito — este spec no agrega rutas protegidas del lado servidor, así que la complejidad de cookies anticipada en spec 04 no tiene uso real todavía.
- **Callback OAuth como página cliente**, no route handler. Motivo: consistente con la decisión anterior — sin `@supabase/ssr`, el intercambio de código funciona client-side con el flujo por defecto de `supabase-js`.
- **`scores.user_id` nullable** en vez de exigir login para jugar o guardar score. Motivo: pedido explícito — el modo invitado se mantiene intacto.
- **`player_name` autocompletado y bloqueado con sesión activa**, en vez de editable siempre. Motivo: pedido explícito — coherencia con "el score queda vinculado al usuario logueado", evita que el nombre mostrado no coincida con la cuenta real.
- **Nombre a mostrar prioriza el que entrega el provider social** sobre `user_metadata.name` de registro por email. Motivo: pedido explícito.
- **Recuperar contraseña fuera de alcance.** Motivo: pedido explícito, no bloquea este spec, se resuelve en uno futuro.
- **Configuración de las apps OAuth (client id/secret) fuera del código.** Motivo: son credenciales externas del dashboard de Supabase/Google/Github, el usuario las va a ir pasando.
- **Se elimina `login()` del contexto de sesión** en vez de mantenerlo como wrapper manual. Motivo: con auth real, el estado debe derivarse solo del listener de Supabase — un setter manual permitiría desincronizar lo mostrado de la sesión real.
- **Sin retro-vinculación de scores históricos.** Motivo: no hay forma de saber a qué usuario pertenecía un score guardado antes de que existiera auth real; mantiene el spec acotado.

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| Las apps OAuth de Google/Github aún no existen — el login social no funciona hasta que el usuario las configure en el dashboard de Supabase. | Se documenta como paso manual explícito (paso 2 del plan); el resto del spec (email/contraseña, persistencia, vínculo de scores) queda funcional sin depender de esto. |
| Ajustar la policy RLS de insert en `scores` puede bloquear por error el guardado en modo invitado si queda mal escrita. | Verificar explícitamente en el criterio de aceptación el guardado de score tanto logueado como invitado antes de dar el spec por cerrado. |
| Supabase Auth requiere configurar la "Redirect URL" de confirmación de email y de OAuth apuntando al dominio correcto (local vs producción). | Documentar en el paso de verificación manual que se debe revisar esa configuración en el dashboard si el link de confirmación o el callback OAuth no vuelven al sitio correcto. |
| `onAuthStateChange` puede dispararse dos veces en desarrollo por Strict Mode de React, duplicando trabajo en el listener. | Seguir el mismo patrón de mount único a prueba de Strict Mode que ya usan los `<id>-canvas.tsx` existentes. |
