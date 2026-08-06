# 14 — Checklist de seguridad básico

> **Estado:** Implementado
> **Depende de:** [04-supabase-setup](04-supabase-setup.md) (cliente Supabase base), [13-autenticacion-supabase](13-autenticacion-supabase.md) (formulario de registro en `app/auth/page.tsx`)
> **Fecha:** 2026-08-06
> **Objetivo:** Agregar los 3 headers de seguridad HTTP en Next.js, mostrar en el registro un checklist dinámico (tooltip) de requisitos de contraseña que bloquea el submit hasta cumplirse, y verificar que RLS, leaked password protection y el rate limit de signup estén activos en Supabase, cerrando `references/security/security-checklist.md`.

## Alcance

**Incluye:**

- `next.config.ts`: agregar los 3 headers de seguridad del checklist (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`) vía `headers()` sobre `/(.*)`.
- `app/auth/page.tsx`, tab "CREAR CUENTA": checklist dinámico de requisitos de contraseña (mín. 8 caracteres, minúscula, mayúscula, dígito, símbolo de un set estándar) mostrado como tooltip junto al campo password, que va tildando cada regla en vivo mientras el usuario tipea.
- Botón "CREAR Y JUGAR" deshabilitado mientras no se cumplan todas las reglas del checklist.
- Verificación manual (sin cambio de código) de que estén activos en el dashboard de Supabase: RLS en `games` y `scores` (ya confirmado `true` en ambas), leaked password protection, y el rate limit de signup por defecto.

**Fuera de alcance:**

- Tab "INICIAR SESIÓN": no muestra ni valida requisitos de contraseña.
- Protección de rutas con `middleware.ts` / migración a `@supabase/ssr` — se descarta explícitamente para este spec (revierte una decisión de spec 13; si se quiere, es un spec propio).
- Content-Security-Policy, `Strict-Transport-Security`, `Permissions-Policy` u otros headers no listados en el checklist.
- Cambiar la longitud mínima de contraseña en el dashboard de Supabase — ya está seteada manualmente por el usuario (confirmado fuera de esta conversación).
- Recuperar contraseña, roles/permisos, vinculación de cuentas — sin relación con este spec.

## Modelo de datos

No se agregan tablas ni columnas — es un cambio de código de UI y configuración de Next.js.

**`app/auth/page.tsx`** — reglas de contraseña como lista tipada, reutilizada tanto para renderizar el checklist como para habilitar/deshabilitar el submit:

```typescript
interface PasswordRule {
  label: string;
  test: (value: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "Mínimo 8 caracteres", test: (v) => v.length >= 8 },
  { label: "Una minúscula", test: (v) => /[a-z]/.test(v) },
  { label: "Una mayúscula", test: (v) => /[A-Z]/.test(v) },
  { label: "Un número", test: (v) => /[0-9]/.test(v) },
  { label: "Un símbolo", test: (v) => /[!@#$%^&*()_+\-=[\]{};':"|,.<>/?~`]/.test(v) },
];
```

`next.config.ts` — array `securityHeaders` tal cual el checklist, aplicado en `headers()`.

## Plan de implementación

1. **`next.config.ts`.** Agregar el array `securityHeaders` y la función `headers()` con los 3 headers sobre `/(.*)`. El sitio sigue funcionando igual, solo cambian los headers de respuesta.
2. **`app/auth/page.tsx` — reglas y estado.** Agregar `PASSWORD_RULES` y un estado derivado (`useMemo` sobre `pass`) que calcula qué reglas se cumplen; solo se evalúa en el tab "up".
3. **`app/auth/page.tsx` — tooltip del checklist.** Envolver el campo password del tab "up" en un contenedor con posición relativa; al hacer foco (o mientras haya texto) mostrar un tooltip absoluto con la lista de `PASSWORD_RULES` y un ✓/· según `test(pass)`. Se oculta en blur si el password es válido, o si es el tab "in".
4. **`app/auth/page.tsx` — bloqueo de submit.** El botón "CREAR Y JUGAR" recibe `disabled={tab === "up" && !PASSWORD_RULES.every((r) => r.test(pass))}` (el tab "in" nunca se deshabilita por esto).
5. **Verificación manual en Supabase dashboard.** Confirmar: RLS `true` en `games`/`scores` (ya verificado por advisor), "Leaked password protection" activo en Auth → Policies (el advisor lo marcaba WARN al momento de escribir este spec — re-chequear), rate limit de signup por IP en su valor default de Auth → Rate Limits.
6. **Verificación manual end-to-end.** Levantar el sitio, ir a `/auth` → "CREAR CUENTA", tipear una contraseña débil (ver botón deshabilitado y checklist con ítems sin tildar), completarla hasta cumplir las 5 reglas (botón se habilita), registrar una cuenta real. Verificar con `curl -I` (o devtools) que la respuesta de cualquier ruta incluya los 3 headers.

## Criterios de aceptación

- [x] Cualquier respuesta HTTP del sitio incluye `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` y `Referrer-Policy: strict-origin-when-cross-origin`.
- [x] En `/auth`, tab "CREAR CUENTA", escribir una contraseña que no cumple alguna regla muestra el tooltip con esa regla sin tildar y el botón "CREAR Y JUGAR" deshabilitado.
- [x] Cumplir las 5 reglas (mín. 8, minúscula, mayúscula, número, símbolo) tilda todo el checklist y habilita el botón.
- [x] El tab "INICIAR SESIÓN" no muestra el checklist ni deshabilita su botón por reglas de contraseña.
- [x] Registrar una cuenta con una contraseña que cumple las 5 reglas funciona igual que antes (sin cambios de comportamiento en `signUp`).
- [x] RLS confirmado `true` en `games` y `scores` (Supabase advisor/dashboard).
- [ ] "Leaked password protection" confirmado activo en Supabase Auth (dashboard). **Pendiente:** requiere plan Pro de Supabase (no disponible en el plan actual); queda sin cumplir hasta que se actualice el plan.
- [x] Rate limit de signup por IP confirmado activo en su valor default (Supabase Auth → Rate Limits).

## Decisiones tomadas y descartadas

- **Solo los 3 headers del checklist** (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`), sin CSP/HSTS/Permissions-Policy. Motivo: pedido explícito — CSP en particular requiere auditar todos los orígenes externos del sitio (Supabase, fonts) para no romper nada, y no está en el checklist original.
- **Checklist de contraseña como tooltip dinámico**, no como texto fijo debajo del campo. Motivo: pedido explícito — mantiene el formulario compacto y da feedback en vivo.
- **Submit deshabilitado hasta cumplir todas las reglas**, en vez de permitir enviar y mostrar error de Supabase. Motivo: pedido explícito — evita el viaje redondo a Supabase con una contraseña que ya se sabe inválida.
- **Set de símbolos estándar** (`!@#$%^&*()_+-=[]{};':"|,.<>/?~\``) sin acotar al charset exacto de Supabase (no documentado). Motivo: pedido explícito; en el peor caso el client-side es más permisivo y Supabase rechaza igual con su error genérico — sin riesgo de seguridad.
- **Validación solo en el tab "CREAR CUENTA"**, no en "INICIAR SESIÓN". Motivo: pedido explícito — no tiene sentido validar formato de una contraseña ya existente.
- **Min password length, leaked password protection y signup rate limit quedan fuera del plan de implementación** — el usuario ya los configuró manualmente en el dashboard de Supabase; este spec solo los deja como criterio de verificación.
- **Protección de rutas con `middleware.ts` / migración a `@supabase/ssr` descartada de este spec.** Motivo: pedido explícito — revierte una decisión tomada en spec 13 (sesión solo en `localStorage`, sin cookies) y es una migración de arquitectura de sesión, no un ítem del checklist de seguridad. Queda para un spec propio si se decide más adelante.

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| El advisor de Supabase sigue marcando "Leaked Password Protection Disabled" como WARN a la fecha de este spec, pese a haberse seteado manualmente. | Re-chequear en el dashboard (Auth → Policies) antes de marcar ese criterio de aceptación como cumplido; puede ser demora de cache del advisor o el toggle no haber quedado guardado. |
| El checklist de contraseña client-side puede quedar desalineado con la regla real de Supabase si el dashboard usa un charset de símbolos distinto al estándar elegido. | Sin impacto de seguridad (Supabase valida igual server-side); si aparece un caso real de rechazo con checklist en verde, ajustar el regex de símbolos. |
| Agregar `headers()` en `next.config.ts` puede interferir con configuración de headers ya presente en algún proveedor de hosting (ej. Vercel) si hay reglas duplicadas o conflictivas. | Verificar en el entorno de despliegue tras el deploy que los headers no queden duplicados o sobreescritos. |
