import type { ButtonHTMLAttributes } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Chip({ active = false, className = "", ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={`border px-3.5 py-3 font-pixel text-[9px] tracking-[0.12em] cursor-pointer transition-colors ${
        active
          ? "text-magenta border-magenta shadow-[0_0_10px_rgba(255,0,110,0.35)]"
          : "text-ink-dim border-line bg-bg-2 hover:text-ink"
      } ${className}`.trim()}
      {...props}
    />
  );
}
