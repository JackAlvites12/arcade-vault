# 02 - Home

**Estado:** Implementado
**Depende de:** [01-mvp-visual](01-mvp-visual.md) (usa `GAMES`, `seededScores()`, theme tokens, `Nav`, `Button`/`ButtonLink`, `Chip`)
**Fecha:** 2026-07-25

## Objetivo

Construir la página de inicio real de Arcade Vault en `/` (reemplazando el redirect a `/biblioteca` del spec 01), maquetando fielmente las secciones de `home.jsx` — hero, por qué Arcade Vault, juegos disponibles, actividad en vivo, precios y CTA final — con datos reales de `app/data/games.ts`, animación scroll-reveal exclusiva de esta página, y agregando los links "Inicio"/"Acerca de" al `Nav` (el segundo sin ruta destino, resolviendo en 404).

## Alcance

### Incluye

- **Ruta `/`** deja de redirigir a `/biblioteca`: pasa a ser `app/page.tsx` con el contenido real de Home.
- **Hero**: eyebrow "▸ INSERTA UNA MONEDA", título en 3 líneas ("EL ARCADE CLÁSICO ESTÁ DE VUELTA"), subtítulo, CTAs "Explorar juegos" (→ `/biblioteca`) y "Crear cuenta" (→ `/auth`), siluetas pixeladas decorativas flotantes (SVGs del prototipo), indicador de scroll.
- **Por qué Arcade Vault**: grid de 4 tarjetas (Juegos clásicos, 100% gratis, Ladder boards, Siempre creciendo) con íconos pixel-art.
- **Juegos disponibles ahora**: rail de 6 mini-tarjetas tomadas de `GAMES` (datos reales), cada una linkeando a `/juego/[id]`; CTA "Ver todos los juegos" → `/biblioteca`.
- **Stats**: bloque de 3 métricas — cantidad de juegos derivada de `GAMES.length` (no el `"12+"` fijo del prototipo), y las otras dos etiquetas se mantienen como texto de marca ("Miles de partidas", "Ranking global").
- **Actividad en vivo**: ticker de puntuaciones recientes + top 5 del día, ambos derivados de `seededScores()` (mismos nombres/juegos que `/salon`, nada de literales nuevos); CTA "Ver salón" → `/salon`.
- **Precios**: tarjeta "plan único $0" con lista de beneficios y mini-FAQ (3 preguntas), CTA "Empezar gratis" → `/auth`. Puramente maquetado, sin checkout ni Stripe.
- **CTA final**: título + botón "Insertar moneda" (→ `/biblioteca`) + texto de refuerzo.
- **Nav** (`app/components/nav.tsx`): agrega "Inicio" (→ `/`) y "Acerca de" (sin ruta real, apunta a `/acerca` que no existe → 404 de Next.js), en desktop y panel móvil, con estado activo por ruta igual que los links existentes. El logo pasa a apuntar a `/` en vez de `/biblioteca`.
- **Scroll-reveal**: hook nuevo (`useReveal`) con `IntersectionObserver`, usado únicamente en `app/page.tsx` — no se toca el resto del sitio.

### No incluye (fuera de este spec)

- Contenido real de "Acerca de": no se crea `/acerca`, el link resuelve en 404 intencionalmente.
- El formulario de contacto de `about.jsx`.
- Backend de pagos real para la sección "Precios" (sigue siendo maqueta).
- Cambios a `/biblioteca`, `/juego/[id]`, `/jugar/[id]`, `/salon` o `/auth` (ya implementados en spec 01; no se tocan).
- Nuevos campos en `Game`/`ScoreRow` o nuevas fuentes de datos — todo sale de `GAMES` y `seededScores()` ya existentes.
- Tests automatizados.

## Modelo de datos

No hay modelo de datos nuevo. Todo sale de `GAMES` y `seededScores()` ya definidos en `app/data/games.ts` (spec 01).

## Plan de implementación

1. **Utilidad de scroll-reveal.** Agregar clases `.home-reveal` / `.home-reveal.in` en `app/globals.css` (mismo patrón que `.fade-in`/`.animate-rise` ya existentes: estado inicial oculto/desplazado, transición al agregar `.in`, respetando `prefers-reduced-motion`). Crear hook `useReveal()` en `app/lib/use-reveal.ts` que observa todos los `.home-reveal` vía `IntersectionObserver` y agrega `.in` al entrar en viewport — equivalente único a los dos hooks duplicados del prototipo (`useReveal` en `home.jsx`, `useEffectAb` en `about.jsx`).

2. **Secciones de Home.** Crear `app/components/home-sections.tsx` exportando: `HomeHero` (incluye las siluetas SVG flotantes), `WhyVaultSection`, `GamesPreviewSection` (`GAMES.slice(0, 6)`, reutiliza `CoverArt`), `StatsSection` (cantidad real vía `GAMES.length`), `LiveActivitySection` (ticker + top 5 vía `seededScores()`), `PricingSection` (plan único + FAQ), `FinalCtaSection`. Cada componente importa `GAMES`/`seededScores` directo, sin prop drilling.

3. **Ensamblar `app/page.tsx`.** Reemplazar `redirect("/biblioteca")` por el render de las 7 secciones en orden (Hero → Why → GamesPreview → Stats → LiveActivity → Pricing → FinalCta) envueltas en `.home-reveal` donde corresponda, llamando `useReveal()` una vez a nivel de página. Marcar el archivo `"use client"` (requerido por el hook).

4. **Actualizar `Nav`.** En `app/components/nav.tsx`: agregar `{ href: "/", label: "Inicio", match: ["/"] }` al inicio de `NAV_LINKS` y `{ href: "/acerca", label: "Acerca de", match: ["/acerca"] }` al final (ruta inexistente → 404 de Next.js al hacer click); reflejar en desktop y panel móvil. Cambiar el link del logo de `/biblioteca` a `/`.

5. **Pulido y verificación.** Responsive de las 7 secciones (mobile stacking), estados hover/focus de botones y tarjetas nuevas, contraste sobre el fondo neón, y confirmar que "Acerca de" efectivamente cae en la página 404 de Next.js.

## Criterios de aceptación

- [x] `/` renderiza la Home real (ya no redirige a `/biblioteca`).
- [x] El hero muestra eyebrow, título en 3 líneas, subtítulo, dos CTAs funcionales ("Explorar juegos" → `/biblioteca`, "Crear cuenta" → `/auth`) y las siluetas flotantes decorativas.
- [x] La sección "Por qué Arcade Vault" muestra las 4 tarjetas (ícono, título, descripción).
- [x] La sección "Juegos disponibles ahora" muestra 6 tarjetas tomadas de `GAMES` (primeros 6), cada una navega a `/juego/[id]` con el `id` correcto; el CTA "Ver todos los juegos" navega a `/biblioteca`.
- [x] La sección Stats muestra el conteo real de juegos vía `GAMES.length` (hoy 8), no un número fijo tipo `"12+"`.
- [x] La sección "Actividad en vivo" muestra un ticker de puntuaciones recientes y un top 5, ambos generados por `seededScores()` (nada de literales fijos); el link "Ver salón" navega a `/salon`.
- [x] La sección "Precios" muestra el plan único $0, la lista de beneficios y la mini-FAQ de 3 preguntas; su CTA navega a `/auth`.
- [x] El CTA final muestra título, botón "Insertar moneda" (→ `/biblioteca`) y texto de refuerzo.
- [x] Cada sección debajo del hero se revela con transición al hacer scroll (`.home-reveal`/`.in` vía `IntersectionObserver`), sin afectar las animaciones de ninguna otra página del sitio.
- [x] El `Nav` muestra "Inicio" y "Acerca de" en desktop y en el panel móvil, con estado activo correspondiente cuando aplica.
- [x] El logo del `Nav` navega a `/` en vez de `/biblioteca`.
- [x] Click en "Acerca de" cae en la página 404 de Next.js (no existe ruta `/acerca`).
- [x] Ninguna otra ruta existente (`/biblioteca`, `/juego/[id]`, `/jugar/[id]`, `/salon`, `/auth`) cambia de comportamiento.
- [x] No se agregan campos nuevos a `Game`/`ScoreRow` ni nuevas fuentes de datos ficticios.

## Decisiones tomadas y descartadas

- **`/` pasa a ser la Home real**, reemplazando el redirect a `/biblioteca` de spec 01. Motivo: pedido explícito; ese redirect era una decisión de MVP visual temporal, no permanente.
- **Se incluyen las 7 secciones del prototipo tal cual**, incluida "Precios". Descartado: recortarla por no haber backend de pagos — se mantiene como maqueta ("gratis para siempre"), consistente con que todo el MVP (spec 01) es visual sin backend real.
- **Actividad en vivo y top jugadores se derivan de `seededScores()`**, no de los literales fijos del prototipo. Motivo: consistencia con `/salon` y `/juego/[id]`; evita una segunda fuente de datos ficticios paralela a `games.ts`.
- **Scroll-reveal exclusivo de Home** (`.home-reveal`, hook nuevo), no se aplica al resto del sitio. Motivo: pedido explícito; las demás páginas ya tienen su propio lenguaje de animación (`fade-in`, `animate-rise`) y no correspondía tocarlo sin pedido.
- **"Acerca de" se agrega al Nav sin ruta real** (cae en 404 de Next.js). Motivo: pedido explícito — mantiene la navegación completa de la plantilla visible sin comprometerse a construir `about.jsx` en este spec.
- **Logo del Nav pasa de `/biblioteca` a `/`**. Motivo: igual que `nav.jsx` de la plantilla (logo → home) y porque `/` ahora es una página real, no un redirect.
- **Stats usa `GAMES.length` en vez del `"12+"` hardcodeado del prototipo**. Motivo: evitar un número inventado que contradiga los 8 juegos reales ya existentes.
- **Las secciones de Home se agrupan en un solo archivo (`home-sections.tsx`)** en vez de uno por sección. Motivo: mismo criterio que `biblioteca/page.tsx` y `salon/page.tsx`, que concentran su UI en un archivo; evita fragmentar en 7 archivos de un solo uso.

## Riesgos identificados

- `useReveal()` es client-only (`IntersectionObserver` no existe en SSR) — requiere `"use client"` en `app/page.tsx`, mismo patrón que `biblioteca`/`salon`/`auth`.
- Si JS no carga, las secciones marcadas `.home-reveal` quedarían con `opacity:0` de forma permanente. Mitigación: el estado inicial en `app/globals.css` debe ser sutil (no `display:none`) y respetar `prefers-reduced-motion`, igual criterio que el resto de animaciones del proyecto.
