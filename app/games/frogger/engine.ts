// Motor de Frogger — construido desde cero (sin puerto de references/started-games).

import { SKINS, type Skin } from "./skins";

export type EngineState = "playing" | "gameover";

export interface EngineSnapshot {
  score: number;
  lives: number;
  level: number;
  state: EngineState;
}

export interface EngineInput {
  up: boolean; // edge-triggered
  down: boolean; // edge-triggered
  left: boolean; // edge-triggered
  right: boolean; // edge-triggered
}

export const COLS = 16;
export const ROWS = 14;
export const CELL = 40; // px
export const CANVAS_W = COLS * CELL; // 640
export const CANVAS_H = ROWS * CELL; // 560

// Zonas (índice de fila, 0 = arriba)
export const ROW_GOALS = 0;
export const ROW_RIVER_TOP = 1;
export const ROW_RIVER_BOT = 6;
export const ROW_SAFE_MID = 7;
export const ROW_ROAD_TOP = 8;
export const ROW_ROAD_BOT = 12;
export const ROW_START = 13;

export const ROUND_TIME_BASE = 15; // segundos
export const JUMP_DURATION = 120; // ms

type Direction = "up" | "down" | "left" | "right";

interface Entity {
  col: number;
  width: number;
  type: "car" | "truck" | "log" | "turtle";
  submerged?: boolean;
  /** Reloj propio del ciclo de inmersión (solo tortugas), desfasado por entidad. */
  cycleT?: number;
  /** Solo para type "car": índice sorteado en skin.carColors. */
  carColorIndex?: number;
}

interface Lane {
  row: number;
  speed: number;
  dir: 1 | -1;
  entities: Entity[];
}

interface Frog {
  col: number;
  row: number;
  animating: boolean;
  animT: number;
  targetCol: number;
  targetRow: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

const LEVEL_SPEED_GROWTH = 1.15; // +15% de velocidad por nivel
export const TURTLE_VISIBLE_S = 3;
export const TURTLE_SUBMERGED_S = 1.5;
const TURTLE_CYCLE_S = TURTLE_VISIBLE_S + TURTLE_SUBMERGED_S;

function makeRoadEntities(): Entity[] {
  const entities: Entity[] = [];
  let col = randInt(0, 3);
  while (col < COLS + 4) {
    const type: Entity["type"] = Math.random() < 0.6 ? "car" : "truck";
    const width = type === "truck" ? randInt(2, 3) : 1;
    const carColorIndex = type === "car" ? randInt(0, 2) : undefined;
    entities.push({ col, width, type, carColorIndex });
    col += width + randInt(3, 5); // hueco atravesable
  }
  return entities;
}

function makeRiverEntities(): Entity[] {
  const entities: Entity[] = [];
  let col = randInt(0, 3);
  while (col < COLS + 4) {
    const isTurtles = Math.random() < 0.45;
    const width = isTurtles ? randInt(2, 3) : randInt(2, 4);
    entities.push({
      col,
      width,
      type: isTurtles ? "turtle" : "log",
      submerged: false,
      cycleT: isTurtles ? rand(0, TURTLE_CYCLE_S) : undefined,
    });
    col += width + randInt(2, 4); // hueco >= 1 celda
  }
  return entities;
}

/** Carriles de carretera (filas 8–12) y de río (filas 1–6) para el nivel dado. */
export function buildLanes(level: number): Lane[] {
  const growth = LEVEL_SPEED_GROWTH ** (level - 1);
  const lanes: Lane[] = [];

  for (let row = ROW_ROAD_TOP; row <= ROW_ROAD_BOT; row++) {
    lanes.push({
      row,
      dir: row % 2 === 0 ? 1 : -1,
      speed: rand(2, 5) * growth, // cols/s
      entities: makeRoadEntities(),
    });
  }

  for (let row = ROW_RIVER_TOP; row <= ROW_RIVER_BOT; row++) {
    lanes.push({
      row,
      dir: row % 2 === 0 ? 1 : -1,
      speed: rand(1, 3) * growth, // cols/s
      entities: makeRiverEntities(),
    });
  }

  return lanes;
}

const START_COL = Math.floor(COLS / 2); // 8
const GOAL_COUNT = 5;
const GOAL_START_COLS = [1, 4, 7, 10, 13]; // cada boca ocupa 2 columnas

function goalIndexAt(col: number): number {
  return GOAL_START_COLS.findIndex((start) => col >= start && col < start + 2);
}

function isInRoad(row: number) {
  return row >= ROW_ROAD_TOP && row <= ROW_ROAD_BOT;
}
function isInRiver(row: number) {
  return row >= ROW_RIVER_TOP && row <= ROW_RIVER_BOT;
}

function checkRoadCollision(frog: Frog, lanes: Lane[]): boolean {
  const lane = lanes.find((l) => l.row === frog.row && isInRoad(l.row));
  if (!lane) return false;
  return lane.entities.some(
    (e) => frog.col >= e.col && frog.col < e.col + e.width,
  );
}

function getSupport(frog: Frog, lanes: Lane[]): Entity | null {
  const lane = lanes.find((l) => l.row === frog.row && isInRiver(l.row));
  if (!lane) return null;
  const support = lane.entities.find(
    (e) => frog.col >= e.col && frog.col < e.col + e.width,
  );
  if (!support || support.submerged) return null;
  return support;
}

const TIME_BAR_H = 6;

export class FroggerEngine {
  static readonly WIDTH = CANVAS_W;
  static readonly HEIGHT = CANVAS_H;

  private frog!: Frog;
  private lanes: Lane[] = [];
  private goals: boolean[] = new Array(GOAL_COUNT).fill(false);
  private score = 0;
  private lives = 3;
  private level = 1;
  private state: EngineState = "playing";
  private roundTime = ROUND_TIME_BASE;
  private bestRowThisRound = ROW_START;
  private pendingDir: Direction | null = null;

  /** Capa visual. Mutable en caliente: cambiar de skin no reinicia la partida. */
  skin: Skin = SKINS.clasico;

  constructor() {
    this.restart();
  }

  restart() {
    this.lives = 3;
    this.score = 0;
    this.level = 1;
    this.state = "playing";
    this.startRound();
  }

  forceGameOver() {
    this.state = "gameover";
  }

  getSnapshot(): EngineSnapshot {
    return {
      score: this.score,
      lives: this.lives,
      level: this.level,
      state: this.state,
    };
  }

  private roundTimeForLevel(): number {
    return Math.max(5, ROUND_TIME_BASE - (this.level - 1));
  }

  private startRound() {
    this.lanes = buildLanes(this.level);
    this.goals = new Array(GOAL_COUNT).fill(false);
    this.frog = {
      col: START_COL,
      row: ROW_START,
      animating: false,
      animT: 0,
      targetCol: START_COL,
      targetRow: ROW_START,
    };
    this.bestRowThisRound = ROW_START;
    this.roundTime = this.roundTimeForLevel();
  }

  private tryStartJump(dir: Direction) {
    const f = this.frog;
    let targetCol = f.col;
    let targetRow = f.row;
    if (dir === "up") targetRow -= 1;
    if (dir === "down") targetRow += 1;
    if (dir === "left") targetCol -= 1;
    if (dir === "right") targetCol += 1;
    if (targetCol < 0 || targetCol >= COLS) return; // no sale de bordes laterales
    if (targetRow < ROW_GOALS || targetRow > ROW_START) return;
    f.animating = true;
    f.animT = 0;
    f.targetCol = targetCol;
    f.targetRow = targetRow;
  }

  private resolveLanding() {
    const f = this.frog;
    if (f.row < this.bestRowThisRound) {
      this.score += 10 * (this.bestRowThisRound - f.row);
      this.bestRowThisRound = f.row;
    }
    if (f.row === ROW_GOALS) {
      this.checkGoal();
      return;
    }
    if (isInRoad(f.row) && checkRoadCollision(f, this.lanes)) {
      this.killFrog();
      return;
    }
    if (isInRiver(f.row) && !getSupport(f, this.lanes)) {
      this.killFrog();
    }
  }

  private checkGoal() {
    const idx = goalIndexAt(this.frog.col);
    if (idx === -1 || this.goals[idx]) {
      this.killFrog();
      return;
    }
    this.goals[idx] = true;
    this.score += 50 + Math.round(this.roundTime) * 10;
    if (this.goals.every(Boolean)) {
      this.completeRound();
    } else {
      this.frog.col = START_COL;
      this.frog.row = ROW_START;
      this.roundTime = this.roundTimeForLevel();
    }
  }

  private completeRound() {
    this.score += 200;
    this.level++;
    this.startRound();
  }

  private killFrog() {
    this.lives--;
    if (this.lives <= 0) {
      this.lives = 0;
      this.state = "gameover";
      return;
    }
    this.frog.col = START_COL;
    this.frog.row = ROW_START;
    this.frog.animating = false;
    this.roundTime = this.roundTimeForLevel();
  }

  update(dt: number, input: EngineInput) {
    if (this.state === "gameover") return;

    if (input.up) this.pendingDir = "up";
    else if (input.down) this.pendingDir = "down";
    else if (input.left) this.pendingDir = "left";
    else if (input.right) this.pendingDir = "right";

    for (const lane of this.lanes) {
      for (const e of lane.entities) {
        e.col += lane.speed * lane.dir * dt;
        if (lane.dir === 1 && e.col > COLS) e.col = -e.width;
        if (lane.dir === -1 && e.col + e.width < 0) e.col = COLS;
        if (e.type === "turtle" && e.cycleT !== undefined) {
          e.cycleT = (e.cycleT + dt) % TURTLE_CYCLE_S;
          e.submerged = e.cycleT >= TURTLE_VISIBLE_S;
        }
      }
    }

    if (!this.frog.animating && this.pendingDir) {
      this.tryStartJump(this.pendingDir);
      this.pendingDir = null;
    }

    if (this.frog.animating) {
      this.frog.animT += dt * 1000;
      if (this.frog.animT >= JUMP_DURATION) {
        this.frog.animating = false;
        this.frog.col = this.frog.targetCol;
        this.frog.row = this.frog.targetRow;
        this.resolveLanding();
      }
    } else if (isInRiver(this.frog.row) && this.state === "playing") {
      const support = getSupport(this.frog, this.lanes);
      if (!support) {
        this.killFrog();
      } else {
        const lane = this.lanes.find((l) => l.row === this.frog.row)!;
        this.frog.col += lane.speed * lane.dir * dt;
        if (this.frog.col < 0 || this.frog.col > COLS - 1) this.killFrog();
      }
    }

    if (this.state === "playing") {
      this.roundTime -= dt;
      if (this.roundTime <= 0) this.killFrog();
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const skin = this.skin;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    for (let row = 0; row < ROWS; row++) {
      ctx.fillStyle =
        row === ROW_GOALS
          ? skin.goalZoneBg
          : isInRiver(row)
            ? skin.riverBg
            : isInRoad(row)
              ? skin.roadBg
              : skin.safeBg;
      ctx.fillRect(0, row * CELL, CANVAS_W, CELL);
    }

    for (let i = 0; i < GOAL_COUNT; i++) {
      const col = GOAL_START_COLS[i];
      ctx.fillStyle = this.goals[i] ? skin.goalFilledBg : skin.goalZoneBg;
      ctx.fillRect(col * CELL, ROW_GOALS * CELL, CELL * 2, CELL);
      ctx.strokeStyle = skin.goalBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        col * CELL + 1,
        ROW_GOALS * CELL + 1,
        CELL * 2 - 2,
        CELL - 2,
      );
      if (this.goals[i]) {
        ctx.fillStyle = skin.frog;
        ctx.beginPath();
        ctx.ellipse(
          col * CELL + CELL,
          ROW_GOALS * CELL + CELL / 2,
          14,
          12,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }

    for (const lane of this.lanes) {
      for (const e of lane.entities) {
        const x = e.col * CELL;
        const y = lane.row * CELL;
        if (e.type === "turtle" && e.submerged) {
          ctx.strokeStyle = skin.turtleSubmerged;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 3, y + 8, e.width * CELL - 6, CELL - 16);
          continue;
        }
        ctx.fillStyle =
          e.type === "car"
            ? skin.carColors[e.carColorIndex ?? 0]
            : e.type === "truck"
              ? skin.truck
              : e.type === "log"
                ? skin.log
                : skin.turtle;
        if (e.type === "car" || e.type === "truck") {
          ctx.fillRect(x + 2, y + 6, e.width * CELL - 4, CELL - 12);
          ctx.fillStyle = "#151515";
          const wheelY = y + CELL - 8;
          ctx.beginPath();
          ctx.arc(x + 10, wheelY, 4, 0, Math.PI * 2);
          ctx.arc(x + e.width * CELL - 10, wheelY, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === "log") {
          ctx.fillRect(x + 1, y + 8, e.width * CELL - 2, CELL - 16);
          ctx.strokeStyle = "rgba(0,0,0,0.3)";
          for (let lx = x + 6; lx < x + e.width * CELL - 6; lx += 10) {
            ctx.beginPath();
            ctx.moveTo(lx, y + 8);
            ctx.lineTo(lx, y + CELL - 8);
            ctx.stroke();
          }
        } else {
          ctx.beginPath();
          ctx.ellipse(
            x + (e.width * CELL) / 2,
            y + CELL / 2,
            (e.width * CELL) / 2 - 3,
            CELL / 2 - 8,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
    }

    const f = this.frog;
    const jumpT = f.animating ? f.animT / JUMP_DURATION : 1;
    const drawCol = f.animating ? f.col + (f.targetCol - f.col) * jumpT : f.col;
    const drawRow = f.animating ? f.row + (f.targetRow - f.row) * jumpT : f.row;
    const hop = f.animating ? Math.sin(Math.PI * jumpT) * 10 : 0;
    ctx.fillStyle = skin.frog;
    ctx.beginPath();
    ctx.ellipse(
      drawCol * CELL + CELL / 2,
      drawRow * CELL + CELL / 2 - hop,
      14,
      12,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(
      drawCol * CELL + CELL / 2 - 5,
      drawRow * CELL + CELL / 2 - 6 - hop,
      3,
      0,
      Math.PI * 2,
    );
    ctx.arc(
      drawCol * CELL + CELL / 2 + 5,
      drawRow * CELL + CELL / 2 - 6 - hop,
      3,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(
      drawCol * CELL + CELL / 2 - 5,
      drawRow * CELL + CELL / 2 - 6 - hop,
      1.4,
      0,
      Math.PI * 2,
    );
    ctx.arc(
      drawCol * CELL + CELL / 2 + 5,
      drawRow * CELL + CELL / 2 - 6 - hop,
      1.4,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = "16px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(String(this.score), 6, 4);
    ctx.textAlign = "center";
    ctx.fillText(`NIVEL ${this.level}`, CANVAS_W / 2, 4);
    ctx.textAlign = "right";
    ctx.fillText("♥".repeat(this.lives) || "-", CANVAS_W - 6, 4);

    const timeRatio = Math.max(0, this.roundTime / this.roundTimeForLevel());
    ctx.fillStyle =
      timeRatio > 0.5 ? "#39ff6a" : timeRatio > 0.2 ? "#f5ff00" : "#ff2e2e";
    ctx.fillRect(0, 0, CANVAS_W * timeRatio, TIME_BAR_H);
  }
}
