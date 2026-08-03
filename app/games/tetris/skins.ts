// Skins de Tetris. El motor pinta bloques planos con un sheen superior; la
// skin cubre fondo, grilla y la paleta de las 8 piezas (índice 1-8 del board).

import type { SkinName } from "@/app/lib/skins";

export type { SkinName };
export { DEFAULT_SKIN } from "@/app/lib/skins";

export interface Skin {
  /** Fondo del tablero. */
  bg: string;
  /** Líneas de la grilla interna. */
  grid: string;
  /** Franja de brillo superior de cada bloque. */
  blockHighlight: string;
  /** Color de cada tipo de pieza, en orden I, O, T, S, Z, J, L, N. */
  pieces: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
}

export const SKINS: Record<SkinName, Skin> = {
  clasico: {
    bg: "#000",
    grid: "rgba(255,255,255,0.08)",
    blockHighlight: "rgba(255,255,255,0.12)",
    pieces: [
      "#4dd0e1",
      "#ffd54f",
      "#ba68c8",
      "#81c784",
      "#e57373",
      "#90caf9",
      "#ffb74d",
      "#9e9e9e",
    ],
  },
  neon: {
    bg: "#000",
    grid: "rgba(0,245,255,0.12)",
    blockHighlight: "rgba(255,255,255,0.18)",
    pieces: [
      "#00f5ff",
      "#f5ff00",
      "#ff006e",
      "#00ff88",
      "#00f5ff",
      "#f5ff00",
      "#ff006e",
      "#00ff88",
    ],
  },
  retro: {
    bg: "#0a0800",
    grid: "rgba(255,176,0,0.07)",
    blockHighlight: "rgba(255,176,0,0.15)",
    pieces: [
      "#ffb000",
      "#ffd68a",
      "#cc8c00",
      "#8a5c00",
      "#ffb000",
      "#ffd68a",
      "#cc8c00",
      "#8a5c00",
    ],
  },
};
