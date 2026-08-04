"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { TetrisEngine, type EngineInput, type EngineSnapshot } from "./engine";
import { DEFAULT_SKIN, SKINS, type SkinName } from "./skins";
import { useFpsCounter } from "@/app/lib/use-fps-counter";

const SHOW_FPS = process.env.NODE_ENV !== "production";

export interface TetrisCanvasHandle {
  restart(): void;
  forceGameOver(): void;
}

export interface TetrisCanvasProps {
  paused: boolean;
  onSnapshot: (snapshot: EngineSnapshot) => void;
  skin?: SkinName;
}

const HANDLED_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowDown",
  "ArrowUp",
  "KeyX",
  "Space",
]);

const TAP_MAX_MS = 220;
const TAP_MAX_DIST = 12;
const SWIPE_MIN_DIST = 24;

export const TetrisCanvas = forwardRef<TetrisCanvasHandle, TetrisCanvasProps>(
  function TetrisCanvas({ paused, onSnapshot, skin = DEFAULT_SKIN }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const nextCanvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<TetrisEngine | null>(null);
    if (!engineRef.current) engineRef.current = new TetrisEngine();

    const pausedRef = useRef(paused);
    pausedRef.current = paused;
    const onSnapshotRef = useRef(onSnapshot);
    onSnapshotRef.current = onSnapshot;

    const fps = useFpsCounter(SHOW_FPS);

    useEffect(() => {
      if (engineRef.current) engineRef.current.skin = SKINS[skin];
    }, [skin]);

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

      let touchId: number | null = null;
      let touchStartX = 0;
      let touchStartY = 0;
      let touchStartTime = 0;
      let gestureMoveLeft = false;
      let gestureMoveRight = false;
      let gestureRotate = false;
      let gestureHardDrop = false;

      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        if (touchId !== null) return;
        const touch = e.changedTouches[0];
        if (!touch) return;
        touchId = touch.identifier;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = performance.now();
      };
      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
      };
      const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        const touch = Array.from(e.changedTouches).find(
          (t) => t.identifier === touchId,
        );
        if (!touch) return;
        touchId = null;
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        const elapsed = performance.now() - touchStartTime;

        if (elapsed < TAP_MAX_MS && Math.hypot(dx, dy) < TAP_MAX_DIST) {
          gestureRotate = true;
          return;
        }
        if (Math.abs(dy) > Math.abs(dx)) {
          if (dy > SWIPE_MIN_DIST) gestureHardDrop = true;
        } else {
          if (dx < -SWIPE_MIN_DIST) gestureMoveLeft = true;
          if (dx > SWIPE_MIN_DIST) gestureMoveRight = true;
        }
      };
      const handleTouchCancel = (e: TouchEvent) => {
        const touch = Array.from(e.changedTouches).find(
          (t) => t.identifier === touchId,
        );
        if (touch) touchId = null;
      };
      canvas.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      canvas.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
      canvas.addEventListener("touchcancel", handleTouchCancel);

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
            moveLeft: !!justPressed["ArrowLeft"] || gestureMoveLeft,
            moveRight: !!justPressed["ArrowRight"] || gestureMoveRight,
            rotate:
              !!(justPressed["ArrowUp"] || justPressed["KeyX"]) ||
              gestureRotate,
            softDrop: !!keys["ArrowDown"],
            hardDrop: !!justPressed["Space"] || gestureHardDrop,
          };
          justPressed["ArrowLeft"] = false;
          justPressed["ArrowRight"] = false;
          justPressed["ArrowUp"] = false;
          justPressed["KeyX"] = false;
          justPressed["Space"] = false;
          gestureMoveLeft = false;
          gestureMoveRight = false;
          gestureRotate = false;
          gestureHardDrop = false;
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
        canvas.removeEventListener("touchstart", handleTouchStart);
        canvas.removeEventListener("touchmove", handleTouchMove);
        canvas.removeEventListener("touchend", handleTouchEnd);
        canvas.removeEventListener("touchcancel", handleTouchCancel);
        resizeObserver.disconnect();
      };
    }, []);

    return (
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center"
      >
        <canvas ref={canvasRef} className="block touch-none" />
        {SHOW_FPS && <div className="fps-overlay">{fps} FPS</div>}
        <div className="absolute top-3 right-3 border border-line bg-bg/80 p-1">
          <canvas ref={nextCanvasRef} className="block" />
        </div>
      </div>
    );
  },
);
