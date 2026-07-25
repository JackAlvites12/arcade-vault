"use client";

import Link from "next/link";
import { useRef, type MouseEvent } from "react";
import type { Game } from "@/app/data/games";
import { CoverArt } from "@/app/components/cover-art";

export function GameCard({ game }: { game: Game }) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translateY(-6px) rotateX(${-py * 6}deg) rotateY(${px * 8}deg)`;
  };

  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <Link
      ref={ref}
      href={`/juego/${game.id}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="group relative flex flex-col gap-3.5 border border-line bg-linear-to-b from-bg-2 to-bg-3 p-3.5 transition-[transform,box-shadow,border-color] duration-200 transform-3d will-change-transform hover:border-cyan hover:shadow-[0_18px_40px_-10px_rgba(0,245,255,0.4),0_0_0_1px_rgba(0,245,255,0.3)]"
    >
      <div className="relative aspect-4/3 overflow-hidden border border-line-2">
        <CoverArt cover={game.cover} />
        <div className="absolute left-2 bottom-2 z-10 border border-line bg-black/60 px-1.5 py-1 font-pixel text-[8px] text-cyan">
          {game.cat}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="font-pixel text-[13px] tracking-[0.06em] text-ink">
          {game.title}
        </div>
        <div className="min-h-9 text-xs text-ink-dim">{game.short}</div>
        <div className="mt-1 flex items-center justify-between gap-2.5">
          <div className="flex flex-col font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">
            <span>MEJOR PUNTUACIÓN</span>
            <b className="font-pixel text-xs tracking-[0.06em] text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.6)]">
              {game.best.toLocaleString("es-ES")}
            </b>
          </div>
          <span className="relative inline-flex items-center justify-center gap-2.5 border border-cyan px-5 py-3 font-pixel text-[10px] tracking-[0.16em] text-ink [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)] transition-[color,box-shadow] group-hover:text-cyan group-hover:shadow-[0_0_14px_rgba(0,245,255,0.55),inset_0_0_8px_rgba(0,245,255,0.35)]">
            JUGAR
          </span>
        </div>
      </div>
    </Link>
  );
}
