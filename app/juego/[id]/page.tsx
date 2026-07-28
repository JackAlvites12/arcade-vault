import { notFound } from "next/navigation";
import { seededScores } from "@/app/data/games";
import { getGame, getTopScores } from "@/app/data/db";
import { CoverArt } from "@/app/components/cover-art";
import { ButtonLink } from "@/app/components/button";
import { RANK_COLOR } from "@/app/lib/rank-color";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) notFound();

  const isRealGame = id === "asteroides" || id === "tetris";
  const scores = isRealGame
    ? await getTopScores(id, 10)
    : seededScores(id.length * 17 + 3, 10);

  return (
    <div className="fade-in mx-auto my-6 grid max-w-330 grid-cols-1 gap-8 px-4 sm:my-12 sm:px-8 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="relative aspect-16/10 overflow-hidden border border-line">
          <CoverArt cover={game.cover} />
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {[game.cat, "1 JUGADOR", "TECLADO / TÁCTIL", "RETRO 1985"].map(
              (tag) => (
                <span
                  key={tag}
                  className="border border-line px-2.5 py-1.5 font-pixel text-[9px] tracking-[0.12em] text-ink-dim"
                >
                  {tag}
                </span>
              ),
            )}
          </div>

          <h2 className="font-pixel text-[clamp(20px,3vw,32px)] tracking-[0.06em] text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.65),0_0_16px_rgba(0,245,255,0.45)]">
            {game.title}
          </h2>

          <p className="text-sm leading-[1.7] text-ink-dim">{game.long}</p>

          <div className="mt-2 grid grid-cols-3 gap-px border border-line bg-line">
            <div className="bg-bg-2 p-3.5">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                Partidas
              </div>
              <div className="mt-1.5 font-pixel text-base text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.5)]">
                {game.plays}
              </div>
            </div>
            <div className="bg-bg-2 p-3.5">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                Mejor global
              </div>
              <div className="mt-1.5 font-pixel text-base text-magenta [text-shadow:0_0_6px_rgba(255,0,110,0.5)]">
                {game.best.toLocaleString("es-ES")}
              </div>
            </div>
            <div className="bg-bg-2 p-3.5">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                Dificultad
              </div>
              <div className="mt-1.5 font-pixel text-base text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.5)]">
                ★ ★ ★ ☆ ☆
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink
              href={`/jugar/${game.id}`}
              size="xl"
              className="animate-pulse-btn"
            >
              ▶ JUGAR AHORA
            </ButtonLink>
            <ButtonLink href="/biblioteca" variant="ghost" size="lg">
              VOLVER AL VAULT
            </ButtonLink>
          </div>
        </div>
      </div>

      <aside className="h-fit border border-line bg-bg-2">
        <h3 className="border-b border-line px-4 py-3.5 font-pixel text-[11px] tracking-[0.14em] text-magenta [text-shadow:0_0_8px_rgba(255,0,110,0.5)]">
          MEJORES PUNTUACIONES
        </h3>
        {scores.length === 0 ? (
          <div className="px-4 py-10 text-center text-ink-faint">
            <div className="mb-2 font-pixel text-xs text-magenta">
              SIN PUNTUACIONES AÚN
            </div>
            <div className="text-sm">SÉ EL PRIMERO</div>
          </div>
        ) : (
          scores.map((r, i) => (
            <div
              key={r.name}
              className="grid grid-cols-[36px_1fr_110px] items-center gap-2.5 border-b border-line-2 px-4 py-2.5 font-mono text-[13px]"
            >
              <div
                className={`font-pixel text-[11px] text-ink-faint ${RANK_COLOR[i] ?? ""}`}
              >
                #{String(r.rank).padStart(2, "0")}
              </div>
              <div className="text-ink">
                {r.name}
                <div className="text-[10px] tracking-widest text-ink-faint">
                  {r.date}
                </div>
              </div>
              <div
                className={`text-right font-pixel text-xs text-cyan ${RANK_COLOR[i] ?? ""}`}
              >
                {r.score.toLocaleString("es-ES")}
              </div>
            </div>
          ))
        )}
      </aside>
    </div>
  );
}
