// Skins de Culebra. El motor pinta con colores planos salvo la fruta, que es un
// sprite PNG: para esa se expone un `ctx.filter` igual que en Arkanoid.

import type { SkinName } from "@/app/lib/skins";

export type { SkinName };
export { DEFAULT_SKIN } from "@/app/lib/skins";

export interface Skin {
  /** Fondo del área de juego. */
  bg: string;
  /** Grilla interna tenue. */
  grid: string;
  /** Borde marcado del límite jugable. */
  border: string;
  /** Cabeza de la serpiente. */
  head: string;
  /** Segmentos del cuerpo. */
  body: string;
  /** Valor de `ctx.filter` aplicado al sprite de la fruta ("none" = sin tocar). */
  fruitFilter: string;
}

export const SKINS: Record<SkinName, Skin> = {
  clasico: {
    bg: "#000",
    grid: "rgba(255,255,255,0.06)",
    border: "#00ff88",
    head: "#00ff88",
    body: "#0a8f52",
    fruitFilter: "none",
  },
  neon: {
    bg: "#000",
    grid: "rgba(0,245,255,0.12)",
    border: "#ff006e",
    head: "#f5ff00",
    body: "#00f5ff",
    fruitFilter: "saturate(2.4) contrast(1.25) brightness(1.2)",
  },
  retro: {
    bg: "#0a0800",
    grid: "rgba(255,176,0,0.07)",
    border: "#ffb000",
    head: "#ffb000",
    body: "#7a5200",
    fruitFilter:
      "grayscale(1) sepia(1) hue-rotate(-14deg) saturate(1.6) brightness(1.05)",
  },
};
