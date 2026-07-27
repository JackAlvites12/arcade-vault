"use client";

import { useEffect, useRef, useState } from "react";
import type { Game } from "@/app/data/games";
import { saveScore } from "@/app/data/db";
import { useSession } from "@/app/session-context";
import { Button, ButtonLink } from "@/app/components/button";
import {
  AsteroidsCanvas,
  type AsteroidsCanvasHandle,
} from "@/app/games/asteroides/asteroids-canvas";
import type { EngineSnapshot } from "@/app/games/asteroides/engine";

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </div>
      <div className={`font-pixel text-base ${valueClass}`}>{value}</div>
    </div>
  );
}

export function JugarClient({ game }: { game: Game }) {
  const isAsteroids = game.id === "asteroides";

  const { user } = useSession();

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [engineLevel, setEngineLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [name, setName] = useState(user ? user.name : "INVITADO");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef<AsteroidsCanvasHandle>(null);

  const level = isAsteroids ? engineLevel : Math.floor(score / 2500) + 1;

  useEffect(() => {
    if (isAsteroids || over || paused) return;
    const t = setInterval(
      () => setScore((s) => s + Math.floor(10 + Math.random() * 90)),
      220,
    );
    return () => clearInterval(t);
  }, [isAsteroids, over, paused]);

  const handleSnapshot = (snapshot: EngineSnapshot) => {
    setScore(snapshot.score);
    setLives(snapshot.lives);
    setEngineLevel(snapshot.level);
    if (snapshot.state === "gameover") setOver(true);
  };

  const endGame = () => {
    if (isAsteroids) canvasRef.current?.forceGameOver();
    setOver(true);
  };
  const restart = () => {
    if (isAsteroids) canvasRef.current?.restart();
    setScore(0);
    setLives(3);
    setEngineLevel(1);
    setPaused(false);
    setOver(false);
    setSaved(false);
  };

  const handleSave = async () => {
    if (isAsteroids) {
      setSaving(true);
      await saveScore("asteroides", name, score);
      setSaving(false);
    }
    setSaved(true);
  };

  return (
    <div className="fade-in mx-auto my-8 max-w-275 px-4 pb-8 sm:px-6 sm:pb-16">
      <div className="mb-4.5 flex flex-wrap items-center justify-between gap-4 border border-line bg-bg-2 px-4.5 py-3.5">
        <div className="flex flex-wrap gap-6">
          <Stat label="Jugador" value={name} valueClass="text-ink" />
          <Stat
            label="Puntuación"
            value={score.toLocaleString("es-ES")}
            valueClass="text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.5)]"
          />
          <Stat
            label="Vidas"
            value={"♥ ".repeat(lives).trim() || "—"}
            valueClass="text-magenta [text-shadow:0_0_6px_rgba(255,0,110,0.5)]"
          />
          <Stat
            label="Nivel"
            value={String(level).padStart(2, "0")}
            valueClass="text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.5)]"
          />
        </div>
        <div className="flex gap-2.5">
          <Button variant="yellow" onClick={() => setPaused((p) => !p)}>
            {paused ? "REANUDAR" : "PAUSA"}
          </Button>
          <Button variant="magenta" onClick={endGame}>
            FIN
          </Button>
          <ButtonLink variant="ghost" href={`/juego/${game.id}`}>
            SALIR
          </ButtonLink>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          {isAsteroids ? (
            <AsteroidsCanvas
              ref={canvasRef}
              paused={paused}
              onSnapshot={handleSnapshot}
            />
          ) : (
            <div className="game-arena">
              <div className="grid-floor" />
              <div className="enemy e1" />
              <div className="enemy e2" />
              <div className="enemy e3" />
              <div className="player-ship" />
            </div>
          )}
          {paused && (
            <div className="absolute inset-0 z-5 flex items-center justify-center bg-black/60 text-center">
              <div>
                <div className="font-pixel text-[22px] text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.7),0_0_16px_rgba(245,255,0,0.4)]">
                  EN PAUSA
                </div>
                <div className="mt-2.5 font-mono text-[11px] tracking-[0.16em] text-ink-dim">
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-3.5 flex items-center justify-between px-2 font-pixel text-[8px] tracking-[0.16em] text-ink-faint">
          <span className="inline-flex items-center gap-1.5 before:h-2 before:w-2 before:rounded-full before:bg-green before:shadow-[0_0_6px_var(--green)] before:content-['']">
            SEÑAL OK
          </span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {over && (
        <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/70 p-5">
          <div className="relative w-[min(480px,96vw)] border border-magenta bg-bg-2 p-8 text-center shadow-[0_0_30px_rgba(255,0,110,0.4),inset_0_0_16px_rgba(255,0,110,0.18)] before:absolute before:inset-1 before:border before:border-dashed before:border-magenta/40 before:pointer-events-none before:content-['']">
            <h2 className="mb-4.5 font-pixel text-[22px] tracking-[0.12em] text-magenta [text-shadow:0_0_12px_rgba(255,0,110,0.7)]">
              FIN DEL JUEGO
            </h2>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
              PUNTUACIÓN FINAL
            </div>
            <div className="my-4 font-pixel text-4xl text-yellow [text-shadow:0_0_16px_rgba(245,255,0,0.6)]">
              {score.toLocaleString("es-ES")}
            </div>
            {!saved ? (
              <div className="my-5.5 flex gap-2">
                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value.toUpperCase().slice(0, 10))
                  }
                  placeholder="TUS INICIALES"
                  className="h-11 flex-1 border border-line bg-bg px-3 font-mono outline-none focus:border-cyan focus:shadow-[0_0_10px_rgba(0,245,255,0.35)]"
                />
                <Button variant="yellow" onClick={handleSave} disabled={saving}>
                  GUARDAR PUNTUACIÓN
                </Button>
              </div>
            ) : (
              <div className="toast-typewriter mt-3.5 font-pixel text-[11px] text-green [text-shadow:0_0_8px_var(--green)]">
                ▸ PUNTUACIÓN GUARDADA_
              </div>
            )}
            <div className="mt-4.5 flex flex-wrap justify-center gap-2.5">
              <Button onClick={restart}>JUGAR DE NUEVO</Button>
              <ButtonLink variant="magenta" href="/biblioteca">
                VOLVER AL VAULT
              </ButtonLink>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
