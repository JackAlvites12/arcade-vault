// Skins de Asteroides. El motor dibuja vectores planos, así que la skin es
// puro conjunto de colores de trazo/relleno.

import type { SkinName } from "@/app/lib/skins";

export type { SkinName };
export { DEFAULT_SKIN } from "@/app/lib/skins";

export interface Skin {
  /** Fondo del área de juego. */
  bg: string;
  /** Trazo del casco de la nave. */
  ship: string;
  /** Trazo de la llama del propulsor (incluye su propio alpha). */
  thrust: string;
  /** Relleno de los disparos. */
  bullet: string;
  /** Trazo de los asteroides. */
  asteroid: string;
  /** Trazo y texto del power-up de triple disparo. */
  powerUp: string;
  /** Componentes RGB de las partículas ("r,g,b"); el alpha lo pone el motor. */
  particleRgb: string;
}

export const SKINS: Record<SkinName, Skin> = {
  clasico: {
    bg: "#000",
    ship: "#fff",
    thrust: "rgba(255, 130, 0, 0.85)",
    bullet: "#fff",
    asteroid: "#fff",
    powerUp: "#0ff",
    particleRgb: "255,255,255",
  },
  neon: {
    bg: "#000",
    ship: "#00f5ff",
    thrust: "rgba(255, 0, 110, 0.85)",
    bullet: "#f5ff00",
    asteroid: "#ff006e",
    powerUp: "#00ff88",
    particleRgb: "245,255,0",
  },
  retro: {
    bg: "#000",
    ship: "#ffb000",
    thrust: "rgba(255, 140, 0, 0.85)",
    bullet: "#ffd68a",
    asteroid: "#b3801f",
    powerUp: "#5ac46b",
    particleRgb: "255,176,0",
  },
};
