// Puerto TypeScript de references/started-games/04-arkanoid/assets/spritesheet.js

export interface SpriteFrame {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export const EXPLOSION_FRAMES: Record<string, SpriteFrame[]> = {
  red: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
  cyan: [
    { sx: 256, sy: 192, sw: 32, sh: 16 },
    { sx: 288, sy: 192, sw: 32, sh: 16 },
    { sx: 320, sy: 192, sw: 32, sh: 16 },
    { sx: 352, sy: 192, sw: 32, sh: 16 },
  ],
  green: [
    { sx: 256, sy: 208, sw: 32, sh: 16 },
    { sx: 288, sy: 208, sw: 32, sh: 16 },
    { sx: 320, sy: 208, sw: 32, sh: 16 },
    { sx: 352, sy: 208, sw: 32, sh: 16 },
  ],
  magenta: [
    { sx: 256, sy: 224, sw: 32, sh: 16 },
    { sx: 288, sy: 224, sw: 32, sh: 16 },
    { sx: 320, sy: 224, sw: 32, sh: 16 },
    { sx: 352, sy: 224, sw: 32, sh: 16 },
  ],
  yellow: [
    { sx: 256, sy: 240, sw: 32, sh: 16 },
    { sx: 288, sy: 240, sw: 32, sh: 16 },
    { sx: 320, sy: 240, sw: 32, sh: 16 },
    { sx: 352, sy: 240, sw: 32, sh: 16 },
  ],
  hotpink: [
    { sx: 256, sy: 256, sw: 32, sh: 16 },
    { sx: 288, sy: 256, sw: 32, sh: 16 },
    { sx: 320, sy: 256, sw: 32, sh: 16 },
    { sx: 352, sy: 256, sw: 32, sh: 16 },
  ],
  gray: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
};

export const EXPLOSION_DURATION = 150;

const SPRITES: Record<string, SpriteFrame> = {
  paddle: { sx: 32, sy: 112, sw: 162, sh: 14 },
  ball: { sx: 32, sy: 32, sw: 16, sh: 16 },
};

const BLOCK_SPRITES: Record<string, SpriteFrame> = {
  gray: { sx: 32, sy: 288, sw: 32, sh: 16 },
  red: { sx: 32, sy: 176, sw: 32, sh: 16 },
  yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
  cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
  magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
  hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
  green: { sx: 32, sy: 208, sw: 32, sh: 16 },
};

let rawImg: HTMLImageElement | null = null;
let ssImg: HTMLCanvasElement | null = null;
let ssLoaded = false;
let ssLoading = false;
let activeFilter = "none";
const ssCallbacks: Array<() => void> = [];
/** Un canvas offscreen por filtro; la spritesheet es pequeña y hay 3 skins. */
const sheets = new Map<string, HTMLCanvasElement>();

function renderSheet(filter: string): HTMLCanvasElement | null {
  if (!rawImg) return null;
  const cached = sheets.get(filter);
  if (cached) return cached;
  const oc = document.createElement("canvas");
  oc.width = rawImg.width;
  oc.height = rawImg.height;
  const octx = oc.getContext("2d");
  if (!octx) return null;
  octx.filter = filter;
  octx.drawImage(rawImg, 0, 0);
  sheets.set(filter, oc);
  return oc;
}

/** Cambia el tinte de la spritesheet. No-op si ya es el activo. */
export function setSpriteFilter(filter: string): void {
  if (filter === activeFilter && ssImg) return;
  activeFilter = filter;
  const sheet = renderSheet(filter);
  if (sheet) ssImg = sheet;
}

export function loadSpritesheet(cb: () => void): void {
  if (ssLoaded) {
    cb();
    return;
  }
  ssCallbacks.push(cb);
  if (ssLoading) return;
  ssLoading = true;

  const img = new Image();
  img.onload = () => {
    rawImg = img;
    ssImg = renderSheet(activeFilter);
    ssLoaded = true;
    ssCallbacks.forEach((f) => f());
    ssCallbacks.length = 0;
  };
  img.onerror = () => console.error("Failed to load spritesheet");
  img.src = "/games/arkanoid/spritesheet-breakout.png";
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  frame: SpriteFrame,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  if (!ssLoaded || !ssImg) return;
  ctx.drawImage(ssImg, frame.sx, frame.sy, frame.sw, frame.sh, x, y, w, h);
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  if (!ssLoaded || !ssImg) return;
  const sprite = name.startsWith("block_")
    ? BLOCK_SPRITES[name.slice(6)]
    : SPRITES[name];
  if (!sprite) return;
  ctx.drawImage(ssImg, sprite.sx, sprite.sy, sprite.sw, sprite.sh, x, y, w, h);
}
