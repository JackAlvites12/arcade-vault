"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { FroggerEngine, type EngineInput, type EngineSnapshot } from "./engine";
import { DEFAULT_SKIN, SKINS, type SkinName } from "./skins";

export interface FroggerCanvasHandle {
  restart(): void;
  forceGameOver(): void;
}

export interface FroggerCanvasProps {
  paused: boolean;
  onSnapshot: (snapshot: EngineSnapshot) => void;
  skin?: SkinName;
}

const HANDLED_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

export const FroggerCanvas = forwardRef<
  FroggerCanvasHandle,
  FroggerCanvasProps
>(function FroggerCanvas({ paused, onSnapshot, skin = DEFAULT_SKIN }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FroggerEngine | null>(null);
  if (!engineRef.current) engineRef.current = new FroggerEngine();

  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const onSnapshotRef = useRef(onSnapshot);
  onSnapshotRef.current = onSnapshot;

  useEffect(() => {
    if (engineRef.current) engineRef.current.skin = SKINS[skin];
  }, [skin]);

  useImperativeHandle(ref, () => ({
    restart: () => engineRef.current?.restart(),
    forceGameOver: () => engineRef.current?.forceGameOver(),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const engine = engineRef.current;
    if (!canvas || !container || !engine) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const keys: Record<string, boolean> = {};
    const justPressed: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!HANDLED_KEYS.has(e.code)) return;
      e.preventDefault();
      if (!keys[e.code]) justPressed[e.code] = true;
      keys[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!HANDLED_KEYS.has(e.code)) return;
      e.preventDefault();
      keys[e.code] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const aspect = FroggerEngine.WIDTH / FroggerEngine.HEIGHT;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      let width = rect.width;
      let height = width / aspect;
      if (height > rect.height) {
        height = rect.height;
        width = height * aspect;
      }
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      // Escala del mundo del juego (FroggerEngine.WIDTH x HEIGHT fijo) al tamaño
      // real del canvas (CSS px * devicePixelRatio) en un solo paso. Frogger es
      // más angosto/vertical (640x560) que el .crt-screen 4:3 compartido, así
      // que se letterboxea igual que culebra/tetris en vez de estirarse.
      ctx.setTransform(
        canvas.width / FroggerEngine.WIDTH,
        0,
        0,
        canvas.height / FroggerEngine.HEIGHT,
        0,
        0,
      );
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let rafId = 0;
    let lastTime: number | null = null;

    const loop = (ts: number) => {
      rafId = requestAnimationFrame(loop);
      const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
      lastTime = ts;

      if (!pausedRef.current) {
        const input: EngineInput = {
          up: !!justPressed["ArrowUp"],
          down: !!justPressed["ArrowDown"],
          left: !!justPressed["ArrowLeft"],
          right: !!justPressed["ArrowRight"],
        };
        justPressed["ArrowUp"] = false;
        justPressed["ArrowDown"] = false;
        justPressed["ArrowLeft"] = false;
        justPressed["ArrowRight"] = false;
        engine.update(dt, input);
        onSnapshotRef.current(engine.getSnapshot());
      }

      engine.draw(ctx);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center"
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
});
