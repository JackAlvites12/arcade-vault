"use client";

import { useMemo, useState } from "react";
import { GAMES, CATS, type GameCategory } from "@/app/data/games";
import { GameCard } from "@/app/components/game-card";
import { Chip } from "@/app/components/chip";

export default function BibliotecaPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"TODOS" | GameCategory>("TODOS");

  const filtered = useMemo(
    () =>
      GAMES.filter(
        (g) =>
          (cat === "TODOS" || g.cat === cat) &&
          g.title.toLowerCase().includes(q.toLowerCase()),
      ),
    [q, cat],
  );

  return (
    <div className="fade-in">
      <section className="mx-auto max-w-330 px-4 pb-4 pt-9 text-center sm:px-8 sm:pb-8 sm:pt-16">
        <h1 className="flicker bg-[linear-gradient(180deg,#fff_0%,var(--cyan)_60%,var(--magenta)_110%)] bg-clip-text font-pixel text-[clamp(28px,6vw,64px)] tracking-[0.06em] text-transparent drop-shadow-[0_0_12px_rgba(0,245,255,0.4)]">
          ARCADE VAULT
        </h1>
        <div className="mt-4.5 font-pixel text-[clamp(10px,1.6vw,14px)] tracking-[0.2em] text-yellow">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </div>
      </section>

      <div className="mx-auto mt-8 flex max-w-330 flex-wrap gap-3 px-4 sm:px-8">
        <div className="flex h-12 min-w-55 flex-1 items-center gap-2.5 border border-line bg-bg-2 px-4 focus-within:border-cyan focus-within:shadow-[0_0_12px_rgba(0,245,255,0.35)]">
          <span className="font-pixel text-[11px] text-cyan">⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar un juego por nombre…"
            className="flex-1 bg-transparent text-[13px] tracking-[0.04em] text-ink outline-none placeholder:text-ink-faint"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mx-auto mb-20 mt-8 grid max-w-330 grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5.5 px-4 sm:px-8">
        {filtered.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center text-ink-faint">
            <div className="mb-3 font-pixel text-sm text-magenta">
              NO HAY RESULTADOS
            </div>
            <div>Intenta otra búsqueda o categoría.</div>
          </div>
        )}
      </div>
    </div>
  );
}
