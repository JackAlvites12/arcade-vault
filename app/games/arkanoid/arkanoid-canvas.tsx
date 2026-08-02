"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  ArkanoidEngine,
  type EngineInput,
  type EngineSnapshot,
} from "./engine";
import { loadSpritesheet } from "./spritesheet";
import { SKINS, DEFAULT_SKIN, type SkinName } from "./skins";

export interface ArkanoidCanvasHandle {
  restart(): void;
  forceGameOver(): void;
}

export interface ArkanoidCanvasProps {
  paused: boolean;
  onSnapshot: (snapshot: EngineSnapshot) => void;
  skin?: SkinName;
}

const HANDLED_KEYS = new Set(["ArrowLeft", "ArrowRight"]);

export const ArkanoidCanvas = forwardRef<
  ArkanoidCanvasHandle,
  ArkanoidCanvasProps
>(function ArkanoidCanvas({ paused, onSnapshot, skin = DEFAULT_SKIN }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ArkanoidEngine | null>(null);
  if (!engineRef.current) engineRef.current = new ArkanoidEngine();

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

    const bounceSound = new Audio("/games/arkanoid/sounds/ball-bounce.mp3");
    const breakSound = new Audio("/games/arkanoid/sounds/break-sound.mp3");
    const playSound = (audio: HTMLAudioElement) =>
      (audio.cloneNode() as HTMLAudioElement).play().catch(() => {});

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!HANDLED_KEYS.has(e.code)) return;
      e.preventDefault();
      keys[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!HANDLED_KEYS.has(e.code)) return;
      e.preventDefault();
      keys[e.code] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let pointerX: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      pointerX = ((e.clientX - rect.left) / rect.width) * ArkanoidEngine.WIDTH;
    };
    container.addEventListener("mousemove", handleMouseMove);

    let started = false;
    let rafId = 0;

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
        canvas.width / ArkanoidEngine.WIDTH,
        0,
        0,
        canvas.height / ArkanoidEngine.HEIGHT,
        0,
        0,
      );
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let lastTime: number | null = null;

    const loop = (ts: number) => {
      rafId = requestAnimationFrame(loop);
      const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
      lastTime = ts;

      if (!pausedRef.current) {
        const input: EngineInput = {
          left: !!keys["ArrowLeft"],
          right: !!keys["ArrowRight"],
          pointerX,
        };
        pointerX = null;
        engine.update(dt, input);
        for (const event of engine.getEvents()) {
          playSound(event === "bounce" ? bounceSound : breakSound);
        }
        onSnapshotRef.current(engine.getSnapshot());
      }

      engine.draw(ctx);
    };

    loadSpritesheet(() => {
      if (started) return;
      started = true;
      rafId = requestAnimationFrame(loop);
    });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      container.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
});
