"use client";

import { useMemo, useState } from "react";
import { seededScores, type Game, type ScoreRow } from "@/app/data/games";
import { useSession } from "@/app/session-context";
import { Chip } from "@/app/components/chip";
import { ButtonLink } from "@/app/components/button";
import { RANK_COLOR } from "@/app/lib/rank-color";

const PODIUM_STYLE = {
  gold: {
    border: "border-gold shadow-[0_0_22px_rgba(255,207,58,0.35)]",
    text: "text-gold",
  },
  silver: { border: "border-silver", text: "text-silver" },
  bronze: { border: "border-bronze", text: "text-bronze" },
} as const;

function PodiumSlot({
  row,
  variant,
  champion = false,
}: {
  row: ScoreRow;
  variant: keyof typeof PODIUM_STYLE;
  champion?: boolean;
}) {
  const style = PODIUM_STYLE[variant];
  return (
    <div
      className={`relative border bg-bg-2 px-3.5 pb-4 pt-4.5 text-center ${style.border}`}
    >
      {champion && (
        <div className="font-pixel text-[9px] tracking-[0.18em] text-gold">
          CAMPEÓN
        </div>
      )}
      <div
        className={`font-pixel [text-shadow:0_0_12px_currentColor] ${style.text} ${
          champion ? "mt-1 text-4xl" : "text-[28px]"
        }`}
      >
        {String(row.rank).padStart(2, "0")}
      </div>
      <div className="mt-2 font-pixel text-xs tracking-[0.06em]">
        {row.name}
      </div>
      <div
        className={`mt-2 font-pixel text-cyan [text-shadow:0_0_8px_rgba(0,245,255,0.5)] ${
          champion ? "text-xl" : "text-base"
        }`}
      >
        {row.score.toLocaleString("es-ES")}
      </div>
      <div className="mt-1.5 font-mono text-[11px] tracking-[0.12em] text-ink-faint">
        {row.date}
      </div>
    </div>
  );
}

const REAL_GAME_IDS = new Set(["asteroides", "tetris", "arkanoid"]);

export function SalonClient({
  games,
  asteroidsScores,
  tetrisScores,
  arkanoidScores,
}: {
  games: Game[];
  asteroidsScores: ScoreRow[];
  tetrisScores: ScoreRow[];
  arkanoidScores: ScoreRow[];
}) {
  const [tab, setTab] = useState(games[0].id);
  const { user } = useSession();

  const seeded = useMemo(() => seededScores(tab.length * 23 + 7, 12), [tab]);
  const rows =
    tab === "asteroides"
      ? asteroidsScores
      : tab === "tetris"
        ? tetrisScores
        : tab === "arkanoid"
          ? arkanoidScores
          : seeded;
  const game = games.find((g) => g.id === tab)!;
  const youRank = user ? 8 + (tab.length % 4) : null;
  const youScore = user ? rows[5]?.score - 2400 : null;
  const isEmpty = REAL_GAME_IDS.has(tab) && rows.length === 0;

  return (
    <div className="fade-in mx-auto mb-20 mt-8 max-w-300 px-4 sm:px-8">
      <div className="mb-7 text-center">
        <h1 className="bg-[linear-gradient(180deg,var(--yellow),var(--magenta))] bg-clip-text font-pixel text-[clamp(24px,4.5vw,44px)] tracking-[0.08em] text-transparent drop-shadow-[0_0_14px_rgba(245,255,0,0.4)]">
          SALÓN DE LA FAMA
        </h1>
        <p className="mt-3 font-pixel text-[10px] tracking-widest text-ink-dim">
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      <div className="mb-5.5 flex flex-wrap justify-center gap-1.5">
        {games.map((g) => (
          <Chip key={g.id} active={tab === g.id} onClick={() => setTab(g.id)}>
            {g.title}
          </Chip>
        ))}
      </div>

      {isEmpty ? (
        <div className="border border-line bg-bg-2 py-20 text-center text-ink-faint">
          <div className="mb-3 font-pixel text-sm text-magenta">
            SIN PUNTUACIONES AÚN
          </div>
          <div>SÉ EL PRIMERO</div>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 items-end gap-3.5 sm:grid-cols-[1fr_1.2fr_1fr]">
            {rows[1] && <PodiumSlot row={rows[1]} variant="silver" />}
            {rows[0] && <PodiumSlot row={rows[0]} variant="gold" champion />}
            {rows[2] && <PodiumSlot row={rows[2]} variant="bronze" />}
          </div>

          <div className="border border-line bg-bg-2">
            <div className="grid grid-cols-[50px_1fr_90px_90px] gap-2.5 border-b border-line px-3 py-2.5 font-pixel text-[10px] tracking-[0.16em] text-ink-faint sm:grid-cols-[70px_1fr_1fr_140px] sm:px-4.5 sm:py-3">
              <div>RANGO</div>
              <div>JUGADOR</div>
              <div>PUNTUACIÓN</div>
              <div>FECHA</div>
            </div>
            {rows.map((r, i) => (
              <div
                key={r.name + i}
                style={{ animationDelay: `${i * 50}ms` }}
                className="animate-rise grid grid-cols-[50px_1fr_90px_90px] items-center gap-2.5 border-b border-line-2 px-3 py-2.5 font-mono text-xs sm:grid-cols-[70px_1fr_1fr_140px] sm:px-4.5 sm:py-3 sm:text-[13px]"
              >
                <div
                  className={`font-pixel text-[11px] text-ink-dim ${RANK_COLOR[i] ?? ""}`}
                >
                  #{String(r.rank).padStart(2, "0")}
                </div>
                <div className="text-ink">{r.name}</div>
                <div
                  className={`font-pixel text-xs text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.4)] ${RANK_COLOR[i] ?? ""}`}
                >
                  {r.score.toLocaleString("es-ES")}
                </div>
                <div className="text-ink-faint">{r.date}</div>
              </div>
            ))}
            {user && (
              <>
                <div className="border-b border-line-2 bg-yellow/4 px-4.5 py-2 font-pixel text-[9px] tracking-[0.16em] text-yellow">
                  ▸ TU MEJOR MARCA EN {game.title}
                </div>
                <div
                  style={{ animationDelay: `${rows.length * 50 + 50}ms` }}
                  className="animate-rise grid grid-cols-[50px_1fr_90px_90px] items-center gap-2.5 border-l-3 border-yellow bg-yellow/5 py-2.5 pl-2.25 pr-3 text-xs font-mono sm:grid-cols-[70px_1fr_1fr_140px] sm:py-3 sm:pl-3.75 sm:pr-4.5 sm:text-[13px]"
                >
                  <div className="font-pixel text-[11px] text-yellow">
                    #{String(youRank).padStart(2, "0")}
                  </div>
                  <div className="text-yellow">{user.name}</div>
                  <div className="font-pixel text-xs text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.5)]">
                    {(youScore || 9999).toLocaleString("es-ES")}
                  </div>
                  <div className="text-ink-faint">11/05/2026</div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <div className="mt-8 text-center">
        <ButtonLink href="/biblioteca" size="lg">
          VOLVER A LA BIBLIOTECA
        </ButtonLink>
      </div>
    </div>
  );
}
