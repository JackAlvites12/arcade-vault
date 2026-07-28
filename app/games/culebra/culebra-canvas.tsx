"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { CulebraEngine, type EngineInput, type EngineSnapshot } from "./engine";

export interface CulebraCanvasHandle {
  restart(): void;
  forceGameOver(): void;
}

export interface CulebraCanvasProps {
  paused: boolean;
  onSnapshot: (snapshot: EngineSnapshot) => void;
}

const KEY_DIRECTIONS: Record<
  string,
  "up" | "down" | "left" | "right" | undefined
> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

export const CulebraCanvas = forwardRef<
  CulebraCanvasHandle,
  CulebraCanvasProps
>(function CulebraCanvas({ paused, onSnapshot }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CulebraEngine | null>(null);
  if (!engineRef.current) engineRef.current = new CulebraEngine();

  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const onSnapshotRef = useRef(onSnapshot);
  onSnapshotRef.current = onSnapshot;

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

    const fruitImage = new Image();
    fruitImage.src = "/snake-assets/fruits.png";

    let requestedDirection: "up" | "down" | "left" | "right" | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      const direction = KEY_DIRECTIONS[e.code];
      if (!direction) return;
      if (engine.getSnapshot().state === "gameover") return;
      e.preventDefault();
      requestedDirection = direction;
    };
    window.addEventListener("keydown", handleKeyDown);

    const aspect = CulebraEngine.WIDTH / CulebraEngine.HEIGHT;
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
      // Escala del mundo del juego (CulebraEngine.WIDTH x HEIGHT fijo) al tamaño
      // real del canvas (CSS px * devicePixelRatio) en un solo paso.
      ctx.setTransform(
        canvas.width / CulebraEngine.WIDTH,
        0,
        0,
        canvas.height / CulebraEngine.HEIGHT,
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
        const input: EngineInput = { direction: requestedDirection };
        engine.update(dt, input);
        onSnapshotRef.current(engine.getSnapshot());
      }

      engine.draw(ctx, fruitImage);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", handleKeyDown);
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
