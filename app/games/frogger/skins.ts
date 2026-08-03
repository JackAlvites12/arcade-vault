// Skins de Frogger. El motor pinta con colores planos por zona (carretera,
// río, mediana, metas) y por tipo de entidad (auto, camión, tronco, tortuga).
// Detalles de sombreado neutro (ruedas, veta del tronco, ojos de la rana, texto
// del HUD interno, semáforo del cronómetro) quedan fuera de la skin: no varían
// entre temas, son chrome funcional igual que el HUD de React.

import type { SkinName } from "@/app/lib/skins";

export type { SkinName };
export { DEFAULT_SKIN } from "@/app/lib/skins";

export interface Skin {
  /** Fondo de la franja de carretera. */
  roadBg: string;
  /** Fondo de la franja de río. */
  riverBg: string;
  /** Fondo de las franjas seguras (salida y mediana). */
  safeBg: string;
  /** Fondo de una boca de meta vacía. */
  goalZoneBg: string;
  /** Fondo de una boca de meta ya ocupada. */
  goalFilledBg: string;
  /** Borde de las bocas de meta. */
  goalBorder: string;
  /** Cuerpo de la rana. */
  frog: string;
  /** Colores de auto, uno se sortea por vehículo. */
  carColors: readonly [string, string, string];
  /** Camión. */
  truck: string;
  /** Tronco flotante. */
  log: string;
  /** Tortuga visible. */
  turtle: string;
  /** Contorno de la tortuga sumergida (incluye su propio alpha). */
  turtleSubmerged: string;
}

export const SKINS: Record<SkinName, Skin> = {
  clasico: {
    roadBg: "#0a0a0a",
    riverBg: "#00243f",
    safeBg: "#0c2b17",
    goalZoneBg: "#0a1f10",
    goalFilledBg: "#123a1c",
    goalBorder: "#e8b923",
    frog: "#39ff6a",
    carColors: ["#e04040", "#e0c040", "#4060e0"],
    truck: "#8a8a8a",
    log: "#6b3f1d",
    turtle: "#2fae4a",
    turtleSubmerged: "rgba(47,174,74,0.35)",
  },
  neon: {
    roadBg: "#0a0010",
    riverBg: "#000a1a",
    safeBg: "#00120a",
    goalZoneBg: "#0a0010",
    goalFilledBg: "#001f14",
    goalBorder: "#f5ff00",
    frog: "#00ff88",
    carColors: ["#ff006e", "#f5ff00", "#00f5ff"],
    truck: "#00f5ff",
    log: "#f5ff00",
    turtle: "#00ff88",
    turtleSubmerged: "rgba(0,255,136,0.35)",
  },
  retro: {
    roadBg: "#0a0800",
    riverBg: "#0a1a08",
    safeBg: "#0a1400",
    goalZoneBg: "#0a1400",
    goalFilledBg: "#142800",
    goalBorder: "#ffb000",
    frog: "#ffb000",
    carColors: ["#cc8c00", "#8a5c00", "#ffd68a"],
    truck: "#8a5c00",
    log: "#5c3d00",
    turtle: "#7a9c1f",
    turtleSubmerged: "rgba(122,156,31,0.35)",
  },
};
