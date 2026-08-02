import type { SkinName } from "@/app/lib/skins";

export function CoverArt({ cover, skin }: { cover: string; skin?: SkinName }) {
  return <div className={`cover-bg ${cover} ${skin ? `skin-${skin}` : ""}`} />;
}
