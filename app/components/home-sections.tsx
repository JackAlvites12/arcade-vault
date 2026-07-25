import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { GAMES, seededScores } from "@/app/data/games";
import { CoverArt } from "@/app/components/cover-art";
import { ButtonLink } from "@/app/components/button";
import { RANK_COLOR } from "@/app/lib/rank-color";

const GLOW: Record<"cyan" | "magenta" | "yellow" | "green", string> = {
  cyan: "text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.65),0_0_16px_rgba(0,245,255,0.45)]",
  magenta:
    "text-magenta [text-shadow:0_0_6px_rgba(255,0,110,0.65),0_0_16px_rgba(255,0,110,0.45)]",
  yellow:
    "text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.7),0_0_16px_rgba(245,255,0,0.4)]",
  green:
    "text-green [text-shadow:0_0_6px_rgba(0,255,136,0.6),0_0_16px_rgba(0,255,136,0.35)]",
};

function SectionHeading({
  kicker,
  title,
  color = "cyan",
}: {
  kicker: string;
  title: string;
  color?: keyof typeof GLOW;
}) {
  return (
    <div className="mb-9 flex flex-wrap items-center gap-4.5">
      <div
        className={`font-pixel text-[11px] tracking-[0.22em] ${GLOW[color]}`}
      >
        {kicker}
      </div>
      <h2 className="font-pixel text-[clamp(18px,2.8vw,28px)] tracking-[0.06em] text-ink">
        {title}
      </h2>
      <div className="h-px min-w-8 flex-1 bg-linear-to-r from-line to-transparent" />
    </div>
  );
}

/* ===== HERO ===== */

const SILHOUETTES: Array<{
  style: CSSProperties;
  render: () => ReactNode;
}> = [
  {
    style: { top: "14%", left: "8%", width: 80, color: "var(--cyan)" },
    render: () => (
      <svg viewBox="0 0 40 32" fill="currentColor">
        <rect x="6" y="4" width="4" height="4" />
        <rect x="30" y="4" width="4" height="4" />
        <rect x="2" y="8" width="36" height="4" />
        <rect x="2" y="12" width="4" height="4" />
        <rect x="14" y="12" width="4" height="4" />
        <rect x="22" y="12" width="4" height="4" />
        <rect x="34" y="12" width="4" height="4" />
        <rect x="2" y="16" width="36" height="4" />
        <rect x="6" y="20" width="4" height="4" />
        <rect x="30" y="20" width="4" height="4" />
      </svg>
    ),
  },
  {
    style: {
      top: "22%",
      right: "10%",
      width: 72,
      color: "var(--magenta)",
      animationDelay: "-1.5s",
    },
    render: () => (
      <svg viewBox="0 0 32 32" fill="currentColor">
        <rect x="8" y="0" width="16" height="4" />
        <rect x="4" y="4" width="24" height="4" />
        <rect x="0" y="8" width="32" height="12" />
        <rect x="0" y="20" width="6" height="6" />
        <rect x="10" y="20" width="4" height="6" />
        <rect x="18" y="20" width="4" height="6" />
        <rect x="26" y="20" width="6" height="6" />
      </svg>
    ),
  },
  {
    style: {
      bottom: "18%",
      left: "12%",
      width: 88,
      color: "var(--yellow)",
      animationDelay: "-3s",
    },
    render: () => (
      <svg viewBox="0 0 32 32" fill="currentColor">
        <rect x="10" y="0" width="12" height="4" />
        <rect x="6" y="4" width="20" height="4" />
        <rect x="4" y="8" width="6" height="6" />
        <rect x="22" y="8" width="6" height="6" />
        <rect x="2" y="14" width="28" height="10" />
        <rect x="6" y="24" width="4" height="4" />
        <rect x="14" y="24" width="4" height="4" />
        <rect x="22" y="24" width="4" height="4" />
      </svg>
    ),
  },
  {
    style: {
      bottom: "22%",
      right: "14%",
      width: 60,
      color: "var(--green)",
      animationDelay: "-4.5s",
    },
    render: () => (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="10" y="0" width="4" height="24" />
        <rect x="0" y="10" width="24" height="4" />
        <rect
          x="6"
          y="6"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
  },
  {
    style: {
      top: "38%",
      left: "4%",
      width: 70,
      color: "#aa00ff",
      animationDelay: "-2s",
    },
    render: () => (
      <svg viewBox="0 0 36 24" fill="currentColor">
        <rect x="14" y="2" width="8" height="4" />
        <rect x="10" y="6" width="16" height="4" />
        <rect x="4" y="10" width="28" height="4" />
        <rect x="0" y="14" width="36" height="4" />
        <rect x="6" y="18" width="4" height="2" />
        <rect x="16" y="18" width="4" height="2" />
        <rect x="26" y="18" width="4" height="2" />
      </svg>
    ),
  },
  {
    style: {
      top: "8%",
      left: "46%",
      width: 44,
      color: "var(--gold)",
      animationDelay: "-3.5s",
    },
    render: () => (
      <svg viewBox="0 0 20 20" fill="currentColor">
        <rect x="6" y="0" width="8" height="2" />
        <rect x="2" y="2" width="16" height="2" />
        <rect x="0" y="4" width="20" height="12" />
        <rect x="2" y="16" width="16" height="2" />
        <rect x="6" y="18" width="8" height="2" />
        <rect x="8" y="4" width="4" height="12" fill="#0a0a0f" />
      </svg>
    ),
  },
  {
    style: {
      bottom: "12%",
      left: "42%",
      width: 52,
      color: "#ff3060",
      animationDelay: "-1s",
    },
    render: () => (
      <svg viewBox="0 0 24 22" fill="currentColor">
        <rect x="2" y="2" width="6" height="2" />
        <rect x="16" y="2" width="6" height="2" />
        <rect x="0" y="4" width="10" height="4" />
        <rect x="14" y="4" width="10" height="4" />
        <rect x="0" y="8" width="24" height="4" />
        <rect x="2" y="12" width="20" height="2" />
        <rect x="4" y="14" width="16" height="2" />
        <rect x="6" y="16" width="12" height="2" />
        <rect x="8" y="18" width="8" height="2" />
        <rect x="10" y="20" width="4" height="2" />
      </svg>
    ),
  },
  {
    style: {
      top: "50%",
      right: "4%",
      width: 60,
      color: "#00d4ff",
      animationDelay: "-5s",
    },
    render: () => (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="8" y="2" width="8" height="6" />
        <rect x="2" y="8" width="20" height="8" />
        <rect x="8" y="16" width="8" height="6" />
        <rect x="11" y="6" width="2" height="2" fill="#0a0a0f" />
        <rect x="11" y="16" width="2" height="2" fill="#0a0a0f" />
        <rect x="4" y="11" width="2" height="2" fill="#0a0a0f" />
        <rect x="18" y="11" width="2" height="2" fill="#0a0a0f" />
      </svg>
    ),
  },
];

function FloatingSilhouettes() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-1 opacity-55"
      aria-hidden="true"
    >
      {SILHOUETTES.map((s, i) => (
        <div key={i} className="silo absolute" style={s.style}>
          {s.render()}
        </div>
      ))}
    </div>
  );
}

export function HomeHero() {
  return (
    <section className="relative flex min-h-[calc(100vh-60px)] items-center justify-center overflow-hidden px-8 pt-20 pb-15">
      <FloatingSilhouettes />
      <div className="relative z-3 mx-auto max-w-275 text-center">
        <div
          className={`mb-6 font-pixel text-[11px] tracking-[0.24em] ${GLOW.yellow}`}
        >
          ▸ INSERTA UNA MONEDA
          <span className="blink">_</span>
        </div>
        <h1 className="flex flex-col gap-2 font-pixel text-[clamp(32px,7vw,88px)] leading-[1.05] tracking-[0.04em]">
          <span className="text-white [text-shadow:0_0_14px_rgba(255,255,255,0.4)]">
            EL ARCADE
          </span>
          <span className="bg-[linear-gradient(180deg,var(--cyan),#4dd0e1)] bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(0,245,255,0.45)]">
            CLÁSICO ESTÁ
          </span>
          <span className="bg-[linear-gradient(180deg,var(--magenta),#ff6b9e)] bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(255,0,110,0.45)]">
            DE VUELTA
          </span>
        </h1>
        <p className="mx-auto mt-7 max-w-160 text-[15px] leading-[1.7] tracking-[0.04em] text-ink-dim">
          Juega los mejores clásicos directamente en tu navegador.
          <br />
          Sin descargas. Sin costo. Solo diversión.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <ButtonLink
            href="/biblioteca"
            size="xl"
            className="animate-pulse-btn"
          >
            ▶ EXPLORAR JUEGOS
          </ButtonLink>
          <ButtonLink href="/auth" variant="magenta" size="xl">
            ✦ CREAR CUENTA
          </ButtonLink>
        </div>
      </div>
      <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 font-pixel text-[9px] tracking-[0.2em] text-ink-faint">
        <span>DESLIZA</span>
        <span className="hero-arrow">▼</span>
      </div>
    </section>
  );
}

/* ===== WHY ARCADE VAULT ===== */

const FEATURES: Array<{
  title: string;
  desc: string;
  color: keyof typeof GLOW;
  icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";
}> = [
  {
    icon: "GAMEPAD",
    title: "JUEGOS CLÁSICOS",
    desc: "Bloque Buster, Caída, Serpentina y muchos más. Los mejores arcades de todos los tiempos en un solo lugar.",
    color: "cyan",
  },
  {
    icon: "FREE",
    title: "100% GRATIS",
    desc: "Sin suscripciones, sin pagos ocultos. Todos los juegos disponibles de forma gratuita.",
    color: "yellow",
  },
  {
    icon: "TROPHY",
    title: "LADDER BOARDS",
    desc: "Compite con jugadores de todo el mundo. Escala el ranking y demuestra quién es el mejor.",
    color: "magenta",
  },
  {
    icon: "ROCKET",
    title: "SIEMPRE CRECIENDO",
    desc: "Agregamos nuevos juegos constantemente. Vuelve seguido, siempre habrá algo nuevo que jugar.",
    color: "green",
  },
];

function FeatureIcon({ kind }: { kind: (typeof FEATURES)[number]["icon"] }) {
  const C = "currentColor";
  if (kind === "GAMEPAD")
    return (
      <svg className="h-11 w-11" viewBox="0 0 16 16">
        <g fill={C}>
          <rect x="2" y="6" width="12" height="6" />
          <rect x="0" y="8" width="2" height="4" />
          <rect x="14" y="8" width="2" height="4" />
          <rect x="3" y="8" width="2" height="2" />
          <rect x="11" y="7" width="1.5" height="1.5" />
          <rect x="11" y="10" width="1.5" height="1.5" />
        </g>
      </svg>
    );
  if (kind === "FREE")
    return (
      <svg className="h-11 w-11" viewBox="0 0 16 16">
        <g fill={C}>
          <rect
            x="3"
            y="3"
            width="10"
            height="10"
            fill="none"
            stroke={C}
            strokeWidth="1.5"
          />
          <rect x="5" y="6" width="1.5" height="4" />
          <rect x="5" y="6" width="4" height="1.5" />
          <rect x="5" y="8" width="3" height="1" />
          <rect x="10" y="6" width="1.5" height="4" />
        </g>
      </svg>
    );
  if (kind === "TROPHY")
    return (
      <svg className="h-11 w-11" viewBox="0 0 16 16">
        <g fill={C}>
          <rect x="3" y="2" width="10" height="2" />
          <rect x="3" y="2" width="2" height="6" />
          <rect x="11" y="2" width="2" height="6" />
          <rect x="5" y="8" width="6" height="2" />
          <rect x="7" y="10" width="2" height="3" />
          <rect x="5" y="13" width="6" height="1.5" />
          <rect x="1" y="3" width="2" height="3" />
          <rect x="13" y="3" width="2" height="3" />
        </g>
      </svg>
    );
  return (
    <svg className="h-11 w-11" viewBox="0 0 16 16">
      <g fill={C}>
        <rect x="7" y="1" width="2" height="2" />
        <rect x="6" y="3" width="4" height="2" />
        <rect x="5" y="5" width="6" height="6" />
        <rect x="4" y="11" width="2" height="2" />
        <rect x="10" y="11" width="2" height="2" />
        <rect x="7" y="6" width="2" height="2" fill="#0a0a0f" />
        <rect x="6" y="13" width="1" height="2" />
        <rect x="9" y="13" width="1" height="2" />
      </g>
    </svg>
  );
}

export function WhyVaultSection() {
  return (
    <section className="home-reveal mx-auto max-w-330 px-4 py-16 sm:px-8">
      <SectionHeading
        kicker="// 01"
        title="¿POR QUÉ ARCADE VAULT?"
        color="magenta"
      />
      <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className={`flex flex-col gap-3.5 border border-line bg-linear-to-b from-bg-2 to-bg-3 p-6 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1.5 hover:border-current hover:shadow-[0_18px_40px_-16px_currentColor,0_0_0_1px_currentColor] ${GLOW[f.color]}`}
          >
            <FeatureIcon kind={f.icon} />
            <div className="font-pixel text-xs tracking-widest">{f.title}</div>
            <div className="text-[13px] leading-[1.6] text-ink-dim">
              {f.desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ===== GAMES PREVIEW ===== */

export function GamesPreviewSection() {
  const preview = GAMES.slice(0, 6);
  return (
    <section className="home-reveal mx-auto max-w-330 px-4 py-16 sm:px-8">
      <SectionHeading
        kicker="// 02"
        title="JUEGOS DISPONIBLES AHORA"
        color="cyan"
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {preview.map((g) => (
          <Link
            key={g.id}
            href={`/juego/${g.id}`}
            className="border border-line bg-bg-2 transition-[transform,border-color] duration-180 hover:-translate-y-1 hover:border-cyan"
          >
            <div className="relative aspect-square overflow-hidden">
              <CoverArt cover={g.cover} />
            </div>
            <div className="p-2.5">
              <div className="font-pixel text-[10px] tracking-[0.06em] text-ink">
                {g.title}
              </div>
              <div className="mt-1 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
                {g.cat}
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-9 text-center">
        <ButtonLink href="/biblioteca" size="lg">
          VER TODOS LOS JUEGOS →
        </ButtonLink>
      </div>
    </section>
  );
}

/* ===== STATS ===== */

export function StatsSection() {
  const stats = [
    { n: `${GAMES.length}`, u: "JUEGOS", s: "Y CONTANDO" },
    { n: "MILES", u: "DE PARTIDAS", s: "JUGADAS CADA DÍA" },
    { n: "GLOBAL", u: "RANKING", s: "COMPITE CON EL MUNDO" },
  ];
  return (
    <section className="home-reveal relative overflow-hidden border-y border-line bg-linear-to-b from-[#06060a] to-[#0c0c14] py-15">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_50%,rgba(245,255,0,0.06),transparent_70%)]" />
      <div className="relative mx-auto grid max-w-300 grid-cols-1 sm:grid-cols-3">
        {stats.map((st, i) => (
          <div
            key={st.u}
            className={`px-5 py-5 text-center ${i > 0 ? "border-line border-t sm:border-t-0 sm:border-l" : ""}`}
          >
            <div className="font-pixel text-[clamp(32px,5vw,56px)] text-yellow [text-shadow:0_0_10px_rgba(245,255,0,0.5)]">
              {st.n}
            </div>
            <div className="mt-2.5 font-pixel text-[13px] tracking-[0.18em] text-ink">
              {st.u}
            </div>
            <div className="mt-2 font-mono text-[11px] tracking-[0.16em] text-ink-faint">
              {st.s}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ===== LIVE ACTIVITY ===== */

const MINUTES_AGO = [2, 5, 8, 12, 18, 24, 31];
const TICKER_COLORS: Array<keyof typeof GLOW> = [
  "magenta",
  "yellow",
  "green",
  "cyan",
];

export function LiveActivitySection() {
  const recent = GAMES.slice(0, 7).map((g, i) => ({
    game: g,
    row: seededScores(g.id.length * 23 + 7, 1)[0],
    minutesAgo: MINUTES_AGO[i],
    color: TICKER_COLORS[i % TICKER_COLORS.length],
  }));
  const top = seededScores(GAMES.length * 23 + 7, 5);

  return (
    <section className="home-reveal mx-auto max-w-330 px-4 py-16 sm:px-8">
      <SectionHeading kicker="// 03" title="ACTIVIDAD EN VIVO" color="yellow" />
      <div className="grid grid-cols-1 gap-4.5 lg:grid-cols-[1.2fr_1fr]">
        <div className="border border-line bg-bg-2">
          <div
            className={`border-b border-line px-3.5 py-3 font-pixel text-[10px] tracking-widest ${GLOW.cyan}`}
          >
            ▸ ÚLTIMAS PUNTUACIONES
          </div>
          <div className="max-h-90 overflow-y-auto">
            {recent.map(({ game, row, minutesAgo, color }) => (
              <div
                key={game.id}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-line-2 px-4.5 py-2.75 font-mono text-[13px] sm:grid-cols-[1fr_auto_auto_auto]"
              >
                <span
                  className={`font-pixel text-[10px] tracking-[0.06em] ${GLOW[color]}`}
                >
                  {row.name}
                </span>
                <span className="col-span-full text-ink-dim sm:col-span-1 sm:text-xs">
                  ▸ {game.title}
                </span>
                <span className="font-pixel text-[11px] text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.5)]">
                  +{row.score.toLocaleString("es-ES")}
                </span>
                <span className="text-[11px] tracking-[0.08em] text-ink-faint">
                  hace {minutesAgo} min
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-line bg-bg-2">
          <div className="flex items-center justify-between gap-2.5 border-b border-line px-3.5 py-3">
            <div
              className={`font-pixel text-[10px] tracking-widest ${GLOW.magenta}`}
            >
              ▸ TOP JUGADORES · HOY
            </div>
            <Link
              href="/salon"
              className="border border-line px-2.5 py-1.5 font-pixel text-[9px] tracking-[0.14em] text-ink-dim transition-[color,border-color,box-shadow] hover:border-magenta hover:text-magenta hover:shadow-[0_0_8px_rgba(255,0,110,0.35)]"
            >
              VER SALÓN →
            </Link>
          </div>
          <div className="flex flex-col gap-2.5 px-4.5 py-3.5">
            {top.map((r) => {
              const rc = RANK_COLOR[r.rank - 1];
              const wash =
                r.rank === 1
                  ? "bg-linear-to-r from-gold/14 to-transparent"
                  : r.rank === 2
                    ? "bg-linear-to-r from-silver/10 to-transparent"
                    : r.rank === 3
                      ? "bg-linear-to-r from-bronze/10 to-transparent"
                      : "";
              return (
                <div
                  key={r.name}
                  className={`grid grid-cols-[36px_1fr_auto] items-center gap-2.5 py-2 font-mono ${wash}`}
                >
                  <span
                    className={`font-pixel text-[10px] text-ink-faint ${rc ?? ""}`}
                  >
                    #{String(r.rank).padStart(2, "0")}
                  </span>
                  <span className="font-pixel text-[11px] tracking-[0.06em] text-ink">
                    {r.name}
                  </span>
                  <span
                    className={`font-pixel text-[11px] text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.4)] ${rc ?? ""}`}
                  >
                    {r.score.toLocaleString("es-ES")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== PRICING ===== */

const BENEFITS = [
  "Acceso a todos los juegos",
  "Ranking global y salón de la fama",
  "Sin anuncios entre partidas",
  "Guarda tus puntuaciones",
  "Nuevos juegos cada mes",
  "Funciona en cualquier navegador",
];

const FAQ = [
  {
    q: "¿REALMENTE ES GRATIS?",
    a: 'Sí. Arcade Vault es un proyecto sin fines de lucro hecho por amor a los clásicos. No hay versión "premium" escondida.',
    accent: "border-l-cyan",
  },
  {
    q: "¿NECESITO CREAR CUENTA?",
    a: "No. Puedes jugar como invitado. Si quieres guardar tu puntuación y aparecer en el ranking, regístrate en 10 segundos.",
    accent: "border-l-magenta",
  },
  {
    q: "¿CÓMO SOBREVIVEN SIN COBRAR?",
    a: "Es un proyecto comunitario. Si te gusta, compártelo. Esa es toda la moneda que aceptamos.",
    accent: "border-l-yellow",
  },
];

export function PricingSection() {
  return (
    <section className="home-reveal mx-auto max-w-330 px-4 py-16 sm:px-8">
      <SectionHeading kicker="// 04" title="PRECIOS" color="green" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="relative border border-green bg-linear-to-b from-bg-2 to-[#0a0e16] p-8 shadow-[0_0_28px_rgba(0,255,136,0.18),inset_0_0_14px_rgba(0,255,136,0.08)]">
          <div className="pointer-events-none absolute inset-1 border border-dashed border-green/30" />
          <div className="font-pixel text-[9px] tracking-[0.22em] text-ink-dim">
            PLAN ÚNICO
          </div>
          <div className="mt-1.5 font-pixel text-base tracking-[0.08em] text-green [text-shadow:0_0_10px_rgba(0,255,136,0.5)]">
            JUGADOR VAULT
          </div>
          <div className="mt-3.5 flex items-baseline gap-2.5">
            <span className="bg-[linear-gradient(180deg,#fff,var(--green))] bg-clip-text font-pixel text-[64px] tracking-[0.02em] text-transparent drop-shadow-[0_0_12px_rgba(0,255,136,0.5)]">
              $0
            </span>
            <span className="font-pixel text-[11px] tracking-[0.16em] text-ink-dim">
              / SIEMPRE
            </span>
          </div>
          <div className="mt-2 font-pixel text-[9px] tracking-[0.18em] text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.45)]">
            SIN TRUCOS · SIN LETRA PEQUEÑA
          </div>
          <ul className="mt-3.5 mb-1 flex flex-col gap-2">
            {BENEFITS.map((b) => (
              <li
                key={b}
                className="font-mono text-[13px] tracking-[0.02em] text-ink first-letter:text-green"
              >
                {b}
              </li>
            ))}
          </ul>
          <ButtonLink
            href="/auth"
            size="lg"
            className="mt-3 w-full animate-pulse-btn"
          >
            EMPEZAR GRATIS →
          </ButtonLink>
          <div className="mt-2.5 text-center font-mono text-[11px] tracking-widest text-ink-faint">
            No pedimos tarjeta. Nunca lo haremos.
          </div>
          <div className="absolute -top-4.5 -right-4.5 z-3 rotate-14 border-2 border-magenta bg-black/85 px-4.5 py-2.5 text-center font-pixel text-[13px] leading-[1.15] tracking-[0.16em] text-magenta shadow-[0_0_14px_rgba(255,0,110,0.35),inset_0_0_8px_rgba(255,0,110,0.2)] [text-shadow:0_0_8px_rgba(255,0,110,0.6)]">
            FREE
            <br />
            PLAY
          </div>
        </div>

        <div className="flex flex-col justify-center gap-3.5">
          {FAQ.map((f) => (
            <div
              key={f.q}
              className={`border border-line ${f.accent} border-l-3 bg-bg-2 p-5`}
            >
              <div className="font-pixel text-[10px] tracking-[0.12em] text-ink">
                {f.q}
              </div>
              <div className="mt-2 font-mono text-[13px] leading-[1.6] text-ink-dim">
                {f.a}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== FINAL CTA ===== */

export function FinalCtaSection() {
  return (
    <section className="home-reveal relative mx-auto max-w-225 px-8 py-25 text-center">
      <div className="absolute top-7.5 left-1/2 h-px w-3/5 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,var(--cyan),transparent)] opacity-50" />
      <h2 className="mb-9 bg-[linear-gradient(180deg,#fff,var(--yellow))] bg-clip-text font-pixel text-[clamp(22px,4vw,40px)] tracking-[0.08em] text-transparent drop-shadow-[0_0_12px_rgba(245,255,0,0.4)]">
        ¿LISTO PARA JUGAR?
      </h2>
      <ButtonLink
        href="/biblioteca"
        size="xl"
        className="animate-pulse-btn px-11 py-6 text-sm tracking-[0.2em]"
      >
        INSERTAR MONEDA →
      </ButtonLink>
      <div className="mt-7 font-mono text-[13px] tracking-[0.06em] text-ink-dim">
        Gratis. Sin registro obligatorio. Empieza en segundos.
      </div>
      <div className="absolute bottom-7.5 left-1/2 h-px w-3/5 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,var(--cyan),transparent)] opacity-50" />
    </section>
  );
}
