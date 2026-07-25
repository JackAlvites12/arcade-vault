"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/app/session-context";
import { Button, ButtonLink } from "@/app/components/button";

const NAV_LINKS = [
  {
    href: "/biblioteca",
    label: "Biblioteca",
    match: ["/biblioteca", "/juego", "/jugar"],
  },
  { href: "/salon", label: "Salón de la Fama", match: ["/salon"] },
];

export function Nav() {
  const pathname = usePathname();
  const { user, signOut } = useSession();
  const [open, setOpen] = useState(false);

  const isActive = (match: string[]) =>
    match.some((m) => pathname.startsWith(m));

  return (
    <>
      <nav className="sticky top-0 z-50 flex items-center gap-6 px-8 py-3.5 border-b border-line bg-linear-to-b from-[rgba(10,10,15,0.92)] to-[rgba(10,10,15,0.78)] backdrop-blur-md">
        <Link href="/biblioteca" className="flex items-center gap-2.5">
          <span className="w-7 h-7 border border-white/20 [background:linear-gradient(45deg,var(--magenta)_0_50%,transparent_50%),linear-gradient(-45deg,var(--cyan)_0_50%,transparent_50%)] bg-blend-screen shadow-[0_0_12px_rgba(0,245,255,0.55),inset_0_0_6px_rgba(255,0,110,0.5)]" />
          <span className="font-pixel text-xs tracking-[0.12em] whitespace-nowrap">
            <span className="text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.65),0_0_16px_rgba(0,245,255,0.45)]">
              ARCADE
            </span>{" "}
            <span className="text-magenta [text-shadow:0_0_6px_rgba(255,0,110,0.65),0_0_16px_rgba(255,0,110,0.45)]">
              VAULT
            </span>
          </span>
        </Link>

        <div className="hidden lg:flex gap-1 ml-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-3.5 py-2.5 font-pixel text-[9px] tracking-[0.16em] transition-colors ${
                isActive(link.match)
                  ? "text-cyan [text-shadow:0_0_8px_rgba(0,245,255,0.65)] after:content-[''] after:absolute after:left-3.5 after:right-3.5 after:bottom-1 after:h-0.5 after:bg-cyan after:shadow-[0_0_8px_var(--cyan),0_0_16px_var(--cyan)]"
                  : "text-ink-dim hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex-1" />

        <div className="hidden lg:flex items-center gap-2 font-pixel text-[9px] text-yellow">
          <span className="w-3.5 h-3.5 rounded-full [background:radial-gradient(circle_at_35%_35%,#fff8b0,#f5ff00_60%,#b0b800)] shadow-[0_0_8px_var(--yellow)]" />
          CRÉDITOS · 03
        </div>

        {user ? (
          <Button variant="ghost" className="ml-4" onClick={signOut}>
            {user.name} ▾
          </Button>
        ) : (
          <ButtonLink href="/auth" className="ml-4">
            Iniciar Sesión
          </ButtonLink>
        )}

        <button
          type="button"
          className="lg:hidden inline-flex items-center justify-center w-9 h-9 text-ink-dim hover:text-ink text-lg"
          onClick={() => setOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div
        className={`fixed inset-0 z-55 bg-black/60 transition-opacity duration-200 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-60 w-[min(320px,86vw)] bg-bg-2 border-l border-line p-6 flex flex-col gap-2 transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="font-pixel text-cyan text-[11px] mb-4">MENÚ</div>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={`py-3.5 px-3 font-pixel text-[11px] border-b border-dashed border-line-2 ${
              isActive(link.match) ? "text-cyan" : "text-ink-dim"
            }`}
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/auth"
          onClick={() => setOpen(false)}
          className={`py-3.5 px-3 font-pixel text-[11px] border-b border-dashed border-line-2 ${
            isActive(["/auth"]) ? "text-cyan" : "text-ink-dim"
          }`}
        >
          {user ? "Cuenta" : "Iniciar Sesión"}
        </Link>
        <div className="flex-1" />
        <div className="font-pixel text-[9px] text-ink-faint tracking-[0.16em]">
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
