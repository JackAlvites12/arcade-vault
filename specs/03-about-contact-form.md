# 03 — Acerca de + Contacto por email

> **Estado:** Implementado
> **Depende de:** [01-mvp-visual](01-mvp-visual.md) (theme tokens, `Nav`), [02-home](02-home.md) (hook `useReveal`, link "Acerca de" en `Nav` que hoy cae en 404)
> **Fecha:** 2026-07-25
> **Objetivo:** Construir la página `/acerca` (misión + highlights + formulario de contacto) replicando `about.jsx`, y conectar el formulario a un endpoint real que envía el mensaje por Resend al equipo y una confirmación al remitente.

## Alcance

### Incluye

- **Ruta `/acerca`** (`app/acerca/page.tsx`): deja de ser 404 y pasa a ser una página real. Reemplaza el hero de misión, los 3 "highlights" (HECHO CON ❤️, JUEGOS EN HTML, PROYECTO EN CRECIMIENTO con sus íconos pixel-art SVG), el divisor animado, y el formulario de contacto de `about.jsx`.
- **Formulario de contacto**: campos NOMBRE, CORREO ELECTRÓNICO, MENSAJE, con la misma validación cliente del prototipo (shake si algún campo va vacío) más validación de formato de email. Incluye un campo honeypot oculto (invisible al usuario) para descartar envíos de bots.
- **Endpoint `app/api/contact/route.ts`** (POST): valida el payload, descarta silenciosamente si el honeypot viene lleno, y usa **Resend** para enviar dos correos: (1) notificación al equipo (`CONTACT_TO_EMAIL`, una dirección `@yopmail.com` de prueba) y (2) confirmación al remitente (a la dirección que puso en el formulario). Remitente ("from") vía sandbox `onboarding@resend.dev`.
- **Estados del formulario**: enviando (botón deshabilitado), éxito (misma animación de terminal `[OK]...` del prototipo), y **error** (nuevo: mismo estilo terminal con línea `[ERROR]` y botón "REINTENTAR").
- **Variables de entorno**: `RESEND_API_KEY` y `CONTACT_TO_EMAIL`, documentadas en `.env.example` (nuevo, sí se commitea) — el usuario ya tiene su propia API key de Resend y la coloca en `.env.local` (no commiteado).
- **Generalizar `useReveal()`** (`app/lib/use-reveal.ts`) para aceptar un selector como parámetro, en vez de tener `.home-reveal` hardcodeado. `/acerca` lo usa con su propio selector (`.about-reveal`); Home sigue llamándolo igual que hoy, pasando `.home-reveal` explícitamente — sin cambios de comportamiento en Home.
- **Dependencia nueva**: paquete `resend` en `package.json`.
- Referencia visual: `references/templates/home-about/about.jsx` (markup) y `references/templates/home-about/styles.css` (clases `.about-*`, `.highlight*`, `.contact-*`, `.terminal-success`).

### No incluye (fuera de este spec)

- Rate limiting o protección antispam más allá del honeypot (ej. reCAPTCHA, límite de envíos por IP).
- Persistencia del mensaje en base de datos o archivo — solo se envía por email, no queda guardado en ningún lado del repo.
- Dominio propio verificado en Resend (se usa el sandbox `onboarding@resend.dev`); si se necesita un dominio de marca, es un cambio de configuración futuro, no de código.
- Cambios a `/`, `/biblioteca`, `/juego/[id]`, `/jugar/[id]`, `/salon` o `/auth` (specs 01/02, no se tocan).
- Tests automatizados.

## Modelo de datos

No hay entidades persistentes — solo el contrato entre el formulario y el endpoint.

```typescript
// app/api/contact/route.ts
interface ContactPayload {
  name: string;
  email: string;
  message: string;
  honeypot: string; // debe llegar vacío; si trae texto, se descarta el envío
}

interface ContactResponse {
  ok: boolean;
  error?: string; // solo si ok === false
}
```

## Plan de implementación

1. **Dependencia y entorno.** Agregar `resend` a `package.json`. Revisar `.env` con `RESEND_API_KEY=` y `CONTACT_TO_EMAIL=arcadevault@yopmail.com`.

2. **Generalizar `useReveal`.** En `app/lib/use-reveal.ts`, cambiar la firma a `useReveal(selector: string)` en vez del `.home-reveal` hardcodeado. Actualizar la única llamada existente en `app/page.tsx` para pasar `".home-reveal"` explícito — cero cambio de comportamiento en Home.

3. **Portar CSS de about/contacto.** Copiar a `app/globals.css` los bloques `.about-hero`, `.about-mission`, `.highlight-row`/`.highlight`, `.about-divider`, `.about-contact`, `.contact-grid`, `.contact-form` (+ `@keyframes shake`), `.terminal-success` desde `references/templates/home-about/styles.css`, adaptados a los theme tokens ya definidos (spec 01). Agregar `.about-reveal`/`.about-reveal.in` con el mismo patrón que `.home-reveal` (incluye `prefers-reduced-motion`).

4. **Página `app/acerca/page.tsx`.** Client component con: hero de misión, fila de 3 highlights (íconos SVG portados de `HighlightIcon`), divisor animado, y formulario controlado (nombre/email/mensaje + campo honeypot oculto vía CSS, no `display:none` para evitar que algunos bots lo detecten). Validación cliente igual al prototipo (shake si falta algún campo). Llama `useReveal(".about-reveal")`.

5. **Endpoint `app/api/contact/route.ts`.** Handler `POST` que valida `ContactPayload` (campos no vacíos, formato de email por regex, `honeypot` vacío — si viene lleno, responde `{ ok: true }` sin enviar nada). Si es válido, usa el SDK de `resend` con `RESEND_API_KEY` para enviar dos correos desde `onboarding@resend.dev`: notificación a `CONTACT_TO_EMAIL` y confirmación al remitente. Responde `ContactResponse` (200 en éxito, 400 en validación, 500 si Resend falla).

6. **Conectar formulario al endpoint.** Estado `idle | sending | success | error` en `app/acerca/page.tsx`. Al enviar: `fetch("/api/contact", { method: "POST", body: JSON.stringify(payload) })`. Éxito → bloque `terminal-success` idéntico al prototipo. Error → mismo estilo terminal con línea `[ERROR] Fallo al enviar. Intenta de nuevo.` y botón "REINTENTAR" que vuelve a `idle` sin borrar lo escrito.

7. **Verificación manual.** Enviar el formulario real y confirmar que llega el correo a `CONTACT_TO_EMAIL` (bandeja yopmail) y la confirmación al remitente; forzar un fallo (API key inválida) para revisar el estado de error; revisar responsive y contraste de toda la página.

## Criterios de aceptación

- [x] `/acerca` ya no cae en 404: renderiza hero de misión, los 3 highlights con sus íconos, el divisor animado y el formulario de contacto.
- [x] Enviar el formulario con algún campo vacío dispara la animación de shake y no llama al endpoint.
- [x] Enviar el formulario con datos válidos llama a `POST /api/contact` y muestra el estado "enviando" (botón deshabilitado) mientras espera la respuesta.
- [x] Un envío exitoso hace llegar un correo real a `CONTACT_TO_EMAIL` (vía Resend) y muestra el bloque `terminal-success` con el nombre en mayúsculas, igual que el prototipo.
- [x] Un envío exitoso también envía un correo de confirmación a la dirección de email que puso el remitente en el formulario.
- [x] Si el campo honeypot llega con texto, el endpoint no envía ningún correo pero responde como éxito (no delata al bot).
- [x] Si el endpoint falla (ej. `RESEND_API_KEY` inválida), la página muestra el estado de error con línea `[ERROR]` y botón "REINTENTAR" que vuelve al formulario sin perder lo escrito.
- [x] Las secciones de `/acerca` se revelan con transición al hacer scroll (`.about-reveal`/`.in`), sin afectar el comportamiento de `.home-reveal` en la Home.
- [x] El link "Acerca de" del `Nav` navega a `/acerca` y ya no cae en 404 (revierte la decisión de spec 02).
- [x] Ninguna otra ruta existente (`/`, `/biblioteca`, `/juego/[id]`, `/jugar/[id]`, `/salon`, `/auth`) cambia de comportamiento.

## Decisiones tomadas y descartadas

- **Resend como proveedor de email.** Motivo: pedido explícito del usuario; ya tiene cuenta y API key.
- **Sandbox `onboarding@resend.dev` como remitente**, en vez de exigir un dominio verificado. Motivo: pedido explícito — permite enviar de inmediato sin configuración de DNS; se puede migrar a un dominio propio después sin tocar código, solo la variable de remitente.
- **`CONTACT_TO_EMAIL` apunta a una dirección `@yopmail.com` de prueba**, no a un correo real del equipo. Motivo: pedido explícito para esta etapa; queda como variable de entorno para poder cambiarla sin tocar código cuando haya un correo definitivo.
- **Confirmación también al remitente** (no solo notificación al equipo). Motivo: pedido explícito.
- **Honeypot como única protección antispam**, sin rate limiting ni CAPTCHA. Motivo: pedido explícito; costo mínimo de implementación, cubre bots simples. Descartado: reCAPTCHA (fricción de UX y dependencia externa nueva para un formulario de bajo riesgo).
- **Sin persistencia del mensaje** (ni DB ni archivo). Motivo: pedido explícito; coherente con que el repo no tiene backend/DB en ningún otro spec.
- **`useReveal()` se generaliza con un parámetro de selector** en vez de duplicar la lógica de `IntersectionObserver` en un segundo hook. Motivo: pedido explícito de reutilizar; evita el mismo problema que spec 02 identificó en el prototipo (`useReveal` y `useEffectAb` como hooks duplicados).
- **CSS de about/contacto portado de `references/templates/home-about/styles.css`**, tal cual, adaptado a los theme tokens existentes. Motivo: pedido explícito de tomarlo como referencia visual; consistente con cómo se portó `styles.css` en spec 01.
- **`/acerca` deja de ser 404**, revirtiendo la decisión explícita de spec 02. Motivo: pedido explícito de este spec; spec 02 ya documentaba que era una decisión temporal hasta que se construyera la página real.

## Riesgos identificados

| Riesgo                                                                                                              | Mitigación                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Sandbox `onboarding@resend.dev` de Resend puede tener límites de envío o marcarse como spam en algunos proveedores. | Aceptable para esta etapa de pruebas con yopmail; migrar a dominio verificado es un cambio de configuración, no de código. |
| `RESEND_API_KEY` ausente o inválida en el entorno de despliegue.                                                    | El endpoint responde 500 y la página muestra el estado de error con "REINTENTAR"; no rompe el resto del sitio.             |
| Bots que sí completan el campo honeypot (honeypots simples no detienen todo).                                       | Aceptable por ahora; rate limiting/CAPTCHA quedan fuera de alcance, mencionados explícitamente como no incluidos.          |
| `.env.local` con la key real se commitea por error.                                                                 | `.gitignore` ya bloquea `.env*`; solo se agrega una excepción puntual para `.env.example` (sin secretos).                  |
