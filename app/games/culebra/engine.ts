// Motor de Culebra (Snake clásico) — grid fijo, movimiento discreto por celda.

import { SKINS, type Skin } from "./skins";

export type EngineState = "playing" | "gameover";

export interface EngineSnapshot {
  score: number;
  lives: number; // siempre 1, HUD no distingue este juego
  level: number; // siempre 1, HUD no distingue este juego
  state: EngineState;
}

type Direction = "up" | "down" | "left" | "right";

export interface EngineInput {
  direction: Direction | null;
}

interface Cell {
  x: number;
  y: number;
}

// Coordenadas traducidas de references/source-assets/snake-assets/sprites.js (apple)
export const FRUIT_SPRITE = { x: 2786, y: 136, w: 110, h: 160 } as const;

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const POINTS_PER_FRUIT = 10;
const TICK_SECONDS = 0.12;

export class CulebraEngine {
  static readonly COLS = 20;
  static readonly ROWS = 20;
  static readonly CELL = 24;
  static readonly WIDTH = CulebraEngine.COLS * CulebraEngine.CELL;
  static readonly HEIGHT = CulebraEngine.ROWS * CulebraEngine.CELL;

  private snake!: Cell[]; // snake[0] = cabeza
  private direction!: Direction;
  private pendingDirection!: Direction;
  private fruit!: Cell;
  private score = 0;
  private state: EngineState = "playing";
  private tickAccum = 0;

  /** Capa visual. Mutable en caliente: cambiar de skin no reinicia la partida. */
  skin: Skin = SKINS.clasico;

  constructor() {
    this.restart();
  }

  restart() {
    const cx = Math.floor(CulebraEngine.COLS / 2);
    const cy = Math.floor(CulebraEngine.ROWS / 2);
    this.snake = [
      { x: cx, y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy },
    ];
    this.direction = "right";
    this.pendingDirection = "right";
    this.score = 0;
    this.state = "playing";
    this.tickAccum = 0;
    this.fruit = this.placeFruit();
  }

  forceGameOver() {
    this.state = "gameover";
  }

  getSnapshot(): EngineSnapshot {
    return { score: this.score, lives: 1, level: 1, state: this.state };
  }

  update(dt: number, input: EngineInput) {
    if (this.state === "gameover") return;

    if (input.direction && input.direction !== OPPOSITE[this.direction]) {
      this.pendingDirection = input.direction;
    }

    this.tickAccum += dt;
    while (this.tickAccum >= TICK_SECONDS) {
      this.tickAccum -= TICK_SECONDS;
      if (this.tick()) {
        this.state = "gameover";
        break;
      }
    }
  }

  /** Avanza un paso de grid. Devuelve `true` si termina en colisión. */
  private tick(): boolean {
    this.direction = this.pendingDirection;
    const head = this.snake[0];
    const next: Cell = { x: head.x, y: head.y };
    if (this.direction === "up") next.y -= 1;
    if (this.direction === "down") next.y += 1;
    if (this.direction === "left") next.x -= 1;
    if (this.direction === "right") next.x += 1;

    if (
      next.x < 0 ||
      next.x >= CulebraEngine.COLS ||
      next.y < 0 ||
      next.y >= CulebraEngine.ROWS
    ) {
      return true;
    }

    const ateFruit = next.x === this.fruit.x && next.y === this.fruit.y;
    // La cola libera su celda salvo que la serpiente vaya a crecer este tick.
    const body = ateFruit ? this.snake : this.snake.slice(0, -1);
    if (body.some((c) => c.x === next.x && c.y === next.y)) {
      return true;
    }

    this.snake.unshift(next);
    if (ateFruit) {
      this.score += POINTS_PER_FRUIT;
      this.fruit = this.placeFruit();
    } else {
      this.snake.pop();
    }
    return false;
  }

  private placeFruit(): Cell {
    const free: Cell[] = [];
    for (let y = 0; y < CulebraEngine.ROWS; y++) {
      for (let x = 0; x < CulebraEngine.COLS; x++) {
        if (!this.snake.some((c) => c.x === x && c.y === y)) {
          free.push({ x, y });
        }
      }
    }
    return free[Math.floor(Math.random() * free.length)];
  }

  draw(ctx: CanvasRenderingContext2D, fruitImage: HTMLImageElement | null) {
    const { CELL, WIDTH, HEIGHT, COLS, ROWS } = CulebraEngine;
    ctx.fillStyle = this.skin.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = this.skin.grid;
    ctx.lineWidth = 0.5;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL, 0);
      ctx.lineTo(c * CELL, HEIGHT);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL);
      ctx.lineTo(WIDTH, r * CELL);
      ctx.stroke();
    }

    // Borde bien marcado del límite jugable, en contraste con la grilla interna tenue.
    ctx.strokeStyle = this.skin.border;
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, WIDTH - 3, HEIGHT - 3);

    if (fruitImage && fruitImage.complete && fruitImage.naturalWidth > 0) {
      ctx.filter = this.skin.fruitFilter;
      ctx.drawImage(
        fruitImage,
        FRUIT_SPRITE.x,
        FRUIT_SPRITE.y,
        FRUIT_SPRITE.w,
        FRUIT_SPRITE.h,
        this.fruit.x * CELL + 2,
        this.fruit.y * CELL + 2,
        CELL - 4,
        CELL - 4,
      );
      ctx.filter = "none";
    }

    this.snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? this.skin.head : this.skin.body;
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    });
  }
}
