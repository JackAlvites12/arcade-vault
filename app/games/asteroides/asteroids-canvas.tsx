"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  AsteroidsEngine,
  type EngineInput,
  type EngineSnapshot,
} from "./engine";

export interface AsteroidsCanvasHandle {
  restart(): void;
  forceGameOver(): void;
}

export interface AsteroidsCanvasProps {
  paused: boolean;
  onSnapshot: (snapshot: EngineSnapshot) => void;
}

const HANDLED_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "Space"]);

export const AsteroidsCanvas = forwardRef<
  AsteroidsCanvasHandle,
  AsteroidsCanvasProps
>(function AsteroidsCanvas({ paused, onSnapshot }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AsteroidsEngine | null>(null);
  if (!engineRef.current) engineRef.current = new AsteroidsEngine();

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

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      // Escala del mundo del juego (800x600 fijo) al tamaño real del canvas
      // (CSS px * devicePixelRatio) en un solo paso.
      ctx.setTransform(
        canvas.width / AsteroidsEngine.WIDTH,
        0,
        0,
        canvas.height / AsteroidsEngine.HEIGHT,
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
          left: !!keys["ArrowLeft"],
          right: !!keys["ArrowRight"],
          thrust: !!keys["ArrowUp"],
          shoot: !!justPressed["Space"],
        };
        justPressed["Space"] = false;
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
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
});
