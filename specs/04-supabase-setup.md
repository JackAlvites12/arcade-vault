# 04 — Setup de Supabase

> **Estado:** Implementado
> **Depende de:** [01-mvp-visual](01-mvp-visual.md) (estructura base del proyecto, `.env.template`)
> **Fecha:** 2026-07-26
> **Objetivo:** Dejar instalado y verificado un cliente Supabase (paquetes, archivo de cliente único, variables de entorno) sin migrar todavía auth ni scores a tablas reales.

## Alcance

**Incluye:**

- Dependencias nuevas: `@supabase/supabase-js` y `@supabase/ssr` en `package.json`.
- Archivo único `lib/supabase/client.ts` que exporta un cliente Supabase (`createClient` de `@supabase/supabase-js`) inicializado con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Usable tanto desde Client Components como desde Server Components/Route Handlers en esta etapa (sin manejo de cookies/sesión todavía, porque no hay auth).
- Variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` agregadas a `.env.template` (mismo archivo que ya existe con las de Resend), con placeholders. El usuario coloca los valores reales de su proyecto Supabase existente en `.env.local` (no commiteado).
- Endpoint temporal `app/api/health/supabase/route.ts` (GET): hace una llamada mínima al cliente (ej. `supabase.auth.getSession()` o un ping equivalente que no requiera ninguna tabla propia) y responde `{ ok: true }` o `{ ok: false, error }`. Sirve para verificar que la conexión funciona; puede borrarse en un spec futuro cuando haya un uso real.

**Fuera de alcance (para specs futuros):**

- Autenticación (`auth.jsx` → Supabase Auth): tipo de método (email/password, magic link, OAuth) queda sin definir, se decide en su propio spec.
- Migración de `GAMES` (catálogo estático) a una tabla Supabase.
- Migración de scores (`av_scores`/`seededScores()`) a tablas reales.
- Rutas protegidas o cualquier lógica de sesión.
- Separación de cliente browser/server (`@supabase/ssr` con manejo de cookies) — el paquete se instala ahora pero no se usa activamente hasta que exista auth.
- Creación del proyecto Supabase en sí (ya existe, provisto por el usuario).

## Modelo de datos

No se introducen estructuras de datos nuevas. Este spec no crea tablas ni tipos de dominio — solo conecta el cliente. El único contrato es la respuesta del endpoint de salud:

```typescript
// app/api/health/supabase/route.ts
interface SupabaseHealthResponse {
  ok: boolean;
  error?: string; // solo si ok === false
}
```

## Plan de implementación

1. **Dependencias.** Agregar `@supabase/supabase-js` y `@supabase/ssr` a `package.json`, correr install.
2. **Variables de entorno.** Agregar `NEXT_PUBLIC_SUPABASE_URL=` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=` a `.env.template`. Documentar en el mismo archivo que van en `.env.local` con los valores reales del proyecto Supabase existente.
3. **Cliente Supabase.** Crear `lib/supabase/client.ts` exportando una función `createSupabaseClient()` (o instancia única) que usa `createClient` de `@supabase/supabase-js` con las dos variables de entorno. Lanza error explícito y legible si falta alguna variable.
4. **Endpoint de salud.** Crear `app/api/health/supabase/route.ts` con handler `GET` que importa el cliente, hace una llamada mínima (`auth.getSession()`), y responde `SupabaseHealthResponse` (200 si `ok`, 500 si falla).
5. **Verificación manual.** Con `.env.local` cargado con las credenciales reales, correr `npm run dev`, pedir `GET /api/health/supabase` y confirmar `{ ok: true }`. Probar también con una variable rota/ausente para confirmar que responde `{ ok: false, error }` sin tumbar el resto del sitio.

## Criterios de aceptación

- [x] `@supabase/supabase-js` y `@supabase/ssr` están en `package.json` y `npm install` corre sin errores.
- [x] `.env.template` incluye `NEXT_PUBLIC_SUPABASE_URL=` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=` junto a las variables de Resend ya existentes.
- [x] `lib/supabase/client.ts` exporta un cliente Supabase funcional usando esas dos variables.
- [x] `GET /api/health/supabase` responde `{ ok: true }` cuando las variables en `.env.local` son válidas.
- [x] `GET /api/health/supabase` responde `{ ok: false, error }` (sin crashear el servidor) cuando falta o es inválida alguna variable.
- [x] Ninguna ruta existente (`/`, `/biblioteca`, `/juego/[id]`, `/jugar/[id]`, `/salon`, `/auth`, `/acerca`) cambia de comportamiento.
- [x] No se crea ninguna tabla, tipo de dominio, ni lógica de auth como parte de este spec.

## Decisiones tomadas y descartadas

- **Solo setup de infraestructura**, sin auth ni migración de datos. Motivo: pedido explícito — evita mezclar una migración grande (auth, scores) en un spec de conexión básica.
- **`@supabase/ssr` se instala ahora aunque no se use activamente.** Motivo: pedido explícito del usuario; evita un segundo spec solo para agregar la dependencia cuando llegue auth.
- **Un solo archivo de cliente (`lib/supabase/client.ts`)**, sin separar browser/server todavía. Motivo: pedido explícito — no hay auth aún, así que no hay necesidad real de manejar cookies de sesión por separado.
- **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** en vez del nombre clásico `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Motivo: pedido explícito del usuario (terminología nueva de Supabase para las API keys públicas).
- **Variables documentadas en `.env.template`** (archivo ya existente del repo, usado por spec 03 para Resend), no un `.env.example` nuevo. Motivo: pedido explícito — mantener un solo archivo de referencia de variables.
- **Endpoint de salud temporal (`/api/health/supabase`)** en vez de verificación solo manual. Motivo: pedido explícito — deja algo verificable y reusable; se puede borrar en un spec futuro sin drama.
- **Proyecto Supabase no se crea en este spec.** Motivo: ya existe, provisto por el usuario.

## Riesgos identificados

| Riesgo                                                                                                              | Mitigación                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| El dashboard de Supabase puede mostrar la key pública como "anon key" en vez de "publishable key" según el proyecto/plan. | Documentar en `.env.template` que el valor corresponde a la key pública/anon del proyecto, sea cual sea el nombre que use el dashboard. |
| `@supabase/ssr` queda instalado sin uso real por ahora.                                                                     | Aceptable, pedido explícito; se activa en el spec de auth sin necesidad de reinstalar nada.                                                  |
| Variables de entorno ausentes en el entorno de despliegue.                                                                  | El endpoint de salud responde `{ ok: false, error }` sin romper el resto del sitio; sirve como chequeo temprano en cualquier entorno.        |
