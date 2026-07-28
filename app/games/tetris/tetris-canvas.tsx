"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { TetrisEngine, type EngineInput, type EngineSnapshot } from "./engine";

export interface TetrisCanvasHandle {
  restart(): void;
  forceGameOver(): void;
}

export interface TetrisCanvasProps {
  paused: boolean;
  onSnapshot: (snapshot: EngineSnapshot) => void;
}

const HANDLED_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowDown",
  "ArrowUp",
  "KeyX",
  "Space",
]);

export const TetrisCanvas = forwardRef<TetrisCanvasHandle, TetrisCanvasProps>(
  function TetrisCanvas({ paused, onSnapshot }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const nextCanvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<TetrisEngine | null>(null);
    if (!engineRef.current) engineRef.current = new TetrisEngine();

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
      const nextCanvas = nextCanvasRef.current;
      const container = containerRef.current;
      const engine = engineRef.current;
      if (!canvas || !nextCanvas || !container || !engine) return;
      const ctx = canvas.getContext("2d");
      const nextCtx = nextCanvas.getContext("2d");
      if (!ctx || !nextCtx) return;

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

      const aspect = TetrisEngine.WIDTH / TetrisEngine.HEIGHT;
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
        // Escala del mundo del juego (TetrisEngine.WIDTH x HEIGHT fijo) al tamaño
        // real del canvas (CSS px * devicePixelRatio) en un solo paso.
        ctx.setTransform(
          canvas.width / TetrisEngine.WIDTH,
          0,
          0,
          canvas.height / TetrisEngine.HEIGHT,
          0,
          0,
        );
      };
      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);

      const nextDpr = window.devicePixelRatio || 1;
      nextCanvas.width = TetrisEngine.NEXT_SIZE * nextDpr;
      nextCanvas.height = TetrisEngine.NEXT_SIZE * nextDpr;
      nextCanvas.style.width = `${TetrisEngine.NEXT_SIZE}px`;
      nextCanvas.style.height = `${TetrisEngine.NEXT_SIZE}px`;
      nextCtx.setTransform(nextDpr, 0, 0, nextDpr, 0, 0);

      let rafId = 0;
      let lastTime: number | null = null;

      const loop = (ts: number) => {
        rafId = requestAnimationFrame(loop);
        const dt =
          lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
        lastTime = ts;

        if (!pausedRef.current) {
          const input: EngineInput = {
            moveLeft: !!justPressed["ArrowLeft"],
            moveRight: !!justPressed["ArrowRight"],
            rotate: !!(justPressed["ArrowUp"] || justPressed["KeyX"]),
            softDrop: !!keys["ArrowDown"],
            hardDrop: !!justPressed["Space"],
          };
          justPressed["ArrowLeft"] = false;
          justPressed["ArrowRight"] = false;
          justPressed["ArrowUp"] = false;
          justPressed["KeyX"] = false;
          justPressed["Space"] = false;
          engine.update(dt, input);
          onSnapshotRef.current(engine.getSnapshot());
        }

        engine.draw(ctx);
        engine.drawNext(nextCtx);
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
        <div className="absolute top-3 right-3 border border-line bg-bg/80 p-1">
          <canvas ref={nextCanvasRef} className="block" />
        </div>
      </div>
    );
  },
);
