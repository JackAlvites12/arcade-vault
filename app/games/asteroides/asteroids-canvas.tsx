"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  AsteroidsEngine,
  type EngineInput,
  type EngineSnapshot,
} from "./engine";
import { DEFAULT_SKIN, SKINS, type SkinName } from "./skins";
import { useFpsCounter } from "@/app/lib/use-fps-counter";

const SHOW_FPS = process.env.NODE_ENV !== "production";

export interface AsteroidsCanvasHandle {
  restart(): void;
  forceGameOver(): void;
}

export interface AsteroidsCanvasProps {
  paused: boolean;
  onSnapshot: (snapshot: EngineSnapshot) => void;
  /** Capa visual; cambiarla no reinicia la partida. */
  skin?: SkinName;
}

const HANDLED_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "Space"]);
const JOYSTICK_RADIUS = 40;
const JOYSTICK_DEADZONE = 14;

export const AsteroidsCanvas = forwardRef<
  AsteroidsCanvasHandle,
  AsteroidsCanvasProps
>(function AsteroidsCanvas({ paused, onSnapshot, skin = DEFAULT_SKIN }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AsteroidsEngine | null>(null);
  if (!engineRef.current) engineRef.current = new AsteroidsEngine();

  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const onSnapshotRef = useRef(onSnapshot);
  onSnapshotRef.current = onSnapshot;

  const fps = useFpsCounter(SHOW_FPS);

  const [joystickOffset, setJoystickOffset] = useState({ x: 0, y: 0 });
  const joystickTouchId = useRef<number | null>(null);
  const joystickCenter = useRef<{ x: number; y: number } | null>(null);
  const touchLeftRef = useRef(false);
  const touchRightRef = useRef(false);
  const touchThrustRef = useRef(false);
  const shootTouchId = useRef<number | null>(null);
  const touchShootRef = useRef(false);

  const updateJoystick = (touch: { clientX: number; clientY: number }) => {
    const center = joystickCenter.current;
    if (!center) return;
    let dx = touch.clientX - center.x;
    let dy = touch.clientY - center.y;
    const dist = Math.hypot(dx, dy);
    if (dist > JOYSTICK_RADIUS) {
      dx = (dx / dist) * JOYSTICK_RADIUS;
      dy = (dy / dist) * JOYSTICK_RADIUS;
    }
    setJoystickOffset({ x: dx, y: dy });
    touchLeftRef.current = dx < -JOYSTICK_DEADZONE;
    touchRightRef.current = dx > JOYSTICK_DEADZONE;
    touchThrustRef.current = dy < -JOYSTICK_DEADZONE;
  };

  const handleJoystickStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (joystickTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    joystickTouchId.current = touch.identifier;
    joystickCenter.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    updateJoystick(touch);
  };

  const handleJoystickMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touch = Array.from(e.touches).find(
      (t) => t.identifier === joystickTouchId.current,
    );
    if (!touch) return;
    updateJoystick(touch);
  };

  const releaseJoystick = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const released = Array.from(e.changedTouches).some(
      (t) => t.identifier === joystickTouchId.current,
    );
    if (!released) return;
    joystickTouchId.current = null;
    joystickCenter.current = null;
    touchLeftRef.current = false;
    touchRightRef.current = false;
    touchThrustRef.current = false;
    setJoystickOffset({ x: 0, y: 0 });
  };

  const handleShootStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (shootTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    shootTouchId.current = touch.identifier;
    touchShootRef.current = true;
  };

  const releaseShoot = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const released = Array.from(e.changedTouches).some(
      (t) => t.identifier === shootTouchId.current,
    );
    if (released) shootTouchId.current = null;
  };

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
    const input: EngineInput = {
      left: false,
      right: false,
      thrust: false,
      shoot: false,
    };

    const loop = (ts: number) => {
      rafId = requestAnimationFrame(loop);
      const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
      lastTime = ts;

      if (!pausedRef.current) {
        input.left = !!keys["ArrowLeft"] || touchLeftRef.current;
        input.right = !!keys["ArrowRight"] || touchRightRef.current;
        input.thrust = !!keys["ArrowUp"] || touchThrustRef.current;
        input.shoot = !!justPressed["Space"] || touchShootRef.current;
        justPressed["Space"] = false;
        touchShootRef.current = false;
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
      {SHOW_FPS && <div className="fps-overlay">{fps} FPS</div>}
      <div className="touch-controls">
        <div
          className="touch-joystick-base"
          onTouchStart={handleJoystickStart}
          onTouchMove={handleJoystickMove}
          onTouchEnd={releaseJoystick}
          onTouchCancel={releaseJoystick}
        >
          <div
            className="touch-joystick-knob"
            style={{
              transform: `translate(${joystickOffset.x}px, ${joystickOffset.y}px)`,
            }}
          />
        </div>
        <button
          type="button"
          aria-label="disparar"
          className="touch-shoot-btn"
          onTouchStart={handleShootStart}
          onTouchEnd={releaseShoot}
          onTouchCancel={releaseShoot}
        >
          ●
        </button>
      </div>
    </div>
  );
});
