// Skins de Arkanoid. Caso especial: el motor dibuja sprites de un PNG, no colores.
// El tema se aplica como `ctx.filter` en el pase offscreen de `spritesheet.ts`.

import type { SkinName } from "@/app/lib/skins";

export type { SkinName };
export { DEFAULT_SKIN } from "@/app/lib/skins";

export interface Skin {
  /** Fondo del área de juego. */
  bg: string;
  /** Valor de `ctx.filter` aplicado a la spritesheet ("none" = sin tocar). */
  spriteFilter: string;
}

export const SKINS: Record<SkinName, Skin> = {
  clasico: {
    bg: "#000",
    spriteFilter: "none",
  },
  neon: {
    bg: "#000",
    spriteFilter: "saturate(2.4) contrast(1.25) brightness(1.2)",
  },
  retro: {
    bg: "#000",
    spriteFilter:
      "grayscale(1) sepia(1) hue-rotate(-14deg) saturate(1.6) brightness(1.05)",
  },
};
