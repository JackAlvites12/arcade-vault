import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type Variant = "cyan" | "magenta" | "yellow" | "ghost";
type Size = "md" | "lg" | "xl";

const base =
  "relative inline-flex items-center justify-center gap-2.5 font-pixel tracking-[0.16em] bg-transparent text-ink cursor-pointer transition-[transform,box-shadow,color] duration-150 [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)] before:content-[''] before:absolute before:inset-[3px] before:border before:border-cyan/25 before:pointer-events-none before:[clip-path:inherit] active:translate-y-px active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  cyan: "border border-cyan hover:text-cyan hover:shadow-[0_0_14px_rgba(0,245,255,0.55),inset_0_0_8px_rgba(0,245,255,0.35)]",
  magenta:
    "border border-magenta hover:text-magenta hover:shadow-[0_0_14px_rgba(255,0,110,0.55),inset_0_0_8px_rgba(255,0,110,0.35)]",
  yellow:
    "border border-yellow hover:text-yellow hover:shadow-[0_0_14px_rgba(245,255,0,0.6),inset_0_0_8px_rgba(245,255,0,0.35)]",
  ghost:
    "border border-ink-faint text-ink-dim hover:text-ink hover:border-ink-dim hover:shadow-none",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-3 text-[10px]",
  lg: "px-7 py-4 text-xs",
  xl: "px-9 py-5 text-sm tracking-[0.2em]",
};

function buttonClasses(variant: Variant, size: Size, className: string) {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({
  variant = "cyan",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function ButtonLink({
  href,
  variant = "cyan",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {children}
    </Link>
  );
}
