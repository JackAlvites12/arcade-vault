// Motor de Tetris — puerto TypeScript de references/started-games/03-tetris/game.js

export type EngineState = "playing" | "gameover";

export interface EngineSnapshot {
  score: number;
  lines: number;
  level: number;
  state: EngineState;
}

export interface EngineInput {
  moveLeft: boolean; // edge-triggered
  moveRight: boolean; // edge-triggered
  rotate: boolean; // edge-triggered
  softDrop: boolean; // held
  hardDrop: boolean; // edge-triggered
}

const COLORS: Array<string | null> = [
  null,
  "#4dd0e1", // I - cyan
  "#ffd54f", // O - yellow
  "#ba68c8", // T - purple
  "#81c784", // S - green
  "#e57373", // Z - red
  "#90caf9", // J - pale blue
  "#ffb74d", // L - orange
  "#9e9e9e", // N - tuerca (gris metálico)
];

const PIECES: Array<number[][] | null> = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
  [
    [8, 8, 8],
    [8, 0, 8],
    [8, 8, 8],
  ], // N (tuerca)
];

const LINE_SCORES = [0, 100, 300, 500, 800];
const WALL_KICKS = [0, -1, 1, -2, 2];

interface Piece {
  type: number;
  shape: number[][];
  x: number;
  y: number;
}

function rotateCW(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const result: number[][] = Array.from({ length: cols }, () =>
    new Array(rows).fill(0),
  );
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
  return result;
}

export class TetrisEngine {
  static readonly COLS = 10;
  static readonly ROWS = 20;
  static readonly BLOCK = 30;
  static readonly WIDTH = TetrisEngine.COLS * TetrisEngine.BLOCK;
  static readonly HEIGHT = TetrisEngine.ROWS * TetrisEngine.BLOCK;
  static readonly NEXT_SIZE = 4 * TetrisEngine.BLOCK;

  private board!: number[][];
  private current!: Piece;
  private next!: Piece;
  private score = 0;
  private lines = 0;
  private level = 1;
  private state: EngineState = "playing";
  private dropAccum = 0;
  private dropInterval = 1000;

  constructor() {
    this.restart();
  }

  restart() {
    this.board = this.createBoard();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.state = "playing";
    this.dropAccum = 0;
    this.dropInterval = 1000;
    this.next = this.randomPiece();
    this.spawn();
  }

  forceGameOver() {
    this.state = "gameover";
  }

  getSnapshot(): EngineSnapshot {
    return {
      score: this.score,
      lines: this.lines,
      level: this.level,
      state: this.state,
    };
  }

  private createBoard(): number[][] {
    return Array.from({ length: TetrisEngine.ROWS }, () =>
      new Array(TetrisEngine.COLS).fill(0),
    );
  }

  private randomPiece(): Piece {
    const type = Math.floor(Math.random() * 8) + 1;
    const shape = PIECES[type]!.map((row) => [...row]);
    return {
      type,
      shape,
      x: Math.floor(TetrisEngine.COLS / 2) - Math.floor(shape[0].length / 2),
      y: 0,
    };
  }

  private collide(shape: number[][], ox: number, oy: number): boolean {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nx = ox + c;
        const ny = oy + r;
        if (nx < 0 || nx >= TetrisEngine.COLS || ny >= TetrisEngine.ROWS)
          return true;
        if (ny >= 0 && this.board[ny][nx]) return true;
      }
    }
    return false;
  }

  private tryRotate() {
    const rotated = rotateCW(this.current.shape);
    for (const kick of WALL_KICKS) {
      if (!this.collide(rotated, this.current.x + kick, this.current.y)) {
        this.current.shape = rotated;
        this.current.x += kick;
        return;
      }
    }
  }

  private merge() {
    for (let r = 0; r < this.current.shape.length; r++)
      for (let c = 0; c < this.current.shape[r].length; c++)
        if (this.current.shape[r][c])
          this.board[this.current.y + r][this.current.x + c] =
            this.current.shape[r][c];
  }

  private clearLines() {
    let cleared = 0;
    for (let r = TetrisEngine.ROWS - 1; r >= 0; r--) {
      if (this.board[r].every((v) => v !== 0)) {
        this.board.splice(r, 1);
        this.board.unshift(new Array(TetrisEngine.COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      this.lines += cleared;
      this.score += (LINE_SCORES[cleared] || 0) * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 90);
    }
  }

  private ghostY(): number {
    let gy = this.current.y;
    while (!this.collide(this.current.shape, this.current.x, gy + 1)) gy++;
    return gy;
  }

  private hardDrop() {
    const gy = this.ghostY();
    this.score += (gy - this.current.y) * 2;
    this.current.y = gy;
    this.lockPiece();
  }

  private lockPiece() {
    this.merge();
    this.clearLines();
    this.spawn();
  }

  private spawn() {
    this.current = this.next;
    this.next = this.randomPiece();
    if (this.collide(this.current.shape, this.current.x, this.current.y)) {
      this.state = "gameover";
    }
  }

  update(dt: number, input: EngineInput) {
    if (this.state === "gameover") return;

    if (
      input.moveLeft &&
      !this.collide(this.current.shape, this.current.x - 1, this.current.y)
    )
      this.current.x--;
    if (
      input.moveRight &&
      !this.collide(this.current.shape, this.current.x + 1, this.current.y)
    )
      this.current.x++;
    if (input.rotate) this.tryRotate();

    let locked = false;
    if (input.hardDrop) {
      this.hardDrop();
      locked = true;
    } else if (input.softDrop) {
      if (
        !this.collide(this.current.shape, this.current.x, this.current.y + 1)
      ) {
        this.current.y++;
        this.score += 1;
      } else {
        this.lockPiece();
        locked = true;
      }
    }

    if (!locked && this.state === "playing") {
      this.dropAccum += dt * 1000;
      if (this.dropAccum >= this.dropInterval) {
        this.dropAccum = 0;
        if (
          !this.collide(this.current.shape, this.current.x, this.current.y + 1)
        ) {
          this.current.y++;
        } else {
          this.lockPiece();
        }
      }
    }
  }

  private drawBlock(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    colorIndex: number,
    size: number,
    alpha?: number,
  ) {
    if (!colorIndex) return;
    ctx.globalAlpha = alpha ?? 1;
    ctx.fillStyle = COLORS[colorIndex]!;
    ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(x * size + 1, y * size + 1, size - 2, 4);
    ctx.globalAlpha = 1;
  }

  private drawGrid(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 0.5;
    for (let c = 1; c < TetrisEngine.COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * TetrisEngine.BLOCK, 0);
      ctx.lineTo(c * TetrisEngine.BLOCK, TetrisEngine.HEIGHT);
      ctx.stroke();
    }
    for (let r = 1; r < TetrisEngine.ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * TetrisEngine.BLOCK);
      ctx.lineTo(TetrisEngine.WIDTH, r * TetrisEngine.BLOCK);
      ctx.stroke();
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, TetrisEngine.WIDTH, TetrisEngine.HEIGHT);
    this.drawGrid(ctx);

    for (let r = 0; r < TetrisEngine.ROWS; r++)
      for (let c = 0; c < TetrisEngine.COLS; c++)
        this.drawBlock(ctx, c, r, this.board[r][c], TetrisEngine.BLOCK);

    const gy = this.ghostY();
    for (let r = 0; r < this.current.shape.length; r++)
      for (let c = 0; c < this.current.shape[r].length; c++)
        if (this.current.shape[r][c])
          this.drawBlock(
            ctx,
            this.current.x + c,
            gy + r,
            this.current.shape[r][c],
            TetrisEngine.BLOCK,
            0.2,
          );

    for (let r = 0; r < this.current.shape.length; r++)
      for (let c = 0; c < this.current.shape[r].length; c++)
        this.drawBlock(
          ctx,
          this.current.x + c,
          this.current.y + r,
          this.current.shape[r][c],
          TetrisEngine.BLOCK,
        );
  }

  drawNext(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, TetrisEngine.NEXT_SIZE, TetrisEngine.NEXT_SIZE);
    const shape = this.next.shape;
    const offX = Math.floor((4 - shape[0].length) / 2);
    const offY = Math.floor((4 - shape.length) / 2);
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        this.drawBlock(
          ctx,
          offX + c,
          offY + r,
          shape[r][c],
          TetrisEngine.BLOCK,
        );
  }
}
