// Capa visual intercambiable: tipos compartidos por todos los juegos.
// Cada `app/games/<id>/skins.ts` reexporta `SkinName` y define su propio `Skin`.

export type SkinName = "clasico" | "neon" | "retro";

export const SKIN_NAMES: readonly SkinName[] = ["clasico", "neon", "retro"];

export const DEFAULT_SKIN: SkinName = "clasico";
