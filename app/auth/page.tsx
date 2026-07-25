"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/session-context";
import { Button } from "@/app/components/button";

export default function AuthPage() {
  const [tab, setTab] = useState<"in" | "up">("in");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [email, setEmail] = useState("");
  const { login } = useSession();
  const router = useRouter();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    login({ name: (user || "PLAYER1").toUpperCase().slice(0, 10) });
    router.push("/biblioteca");
  };

  const playAsGuest = () => {
    login(null);
    router.push("/biblioteca");
  };

  return (
    <div className="fade-in flex items-center justify-center px-5 py-15">
      <div className="relative w-full max-w-110 border border-line bg-bg-2 p-7 shadow-[0_0_30px_rgba(0,245,255,0.18)] before:absolute before:inset-1 before:border before:border-dashed before:border-cyan/18 before:pointer-events-none before:content-['']">
        <div className="mb-4.5 text-center">
          <div className="mx-auto mb-3 h-14 w-14 border border-white/20 [background:linear-gradient(45deg,var(--magenta)_0_50%,transparent_50%),linear-gradient(-45deg,var(--cyan)_0_50%,transparent_50%)] bg-blend-screen shadow-[0_0_16px_rgba(0,245,255,0.55),inset_0_0_8px_rgba(255,0,110,0.5)]" />
          <h2 className="font-pixel text-base tracking-widest">ARCADE VAULT</h2>
          <div className="mt-1.5 font-mono text-[11px] tracking-[0.16em] text-ink-faint">
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        <div className="my-4.5 grid grid-cols-2 border border-line">
          <button
            type="button"
            onClick={() => setTab("in")}
            className={`cursor-pointer px-3 py-3 font-pixel text-[9px] tracking-[0.14em] ${
              tab === "in"
                ? "bg-cyan/8 text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.5)]"
                : "text-ink-dim"
            }`}
          >
            INICIAR SESIÓN
          </button>
          <button
            type="button"
            onClick={() => setTab("up")}
            className={`cursor-pointer px-3 py-3 font-pixel text-[9px] tracking-[0.14em] ${
              tab === "up"
                ? "bg-cyan/8 text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.5)]"
                : "text-ink-dim"
            }`}
          >
            CREAR CUENTA
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              Usuario
            </span>
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="px_kai"
              className="h-11 border border-line bg-bg px-3 font-mono outline-none focus:border-cyan focus:shadow-[0_0_12px_rgba(0,245,255,0.35)]"
            />
          </label>
          {tab === "up" && (
            <label className="slide-in flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                Correo electrónico
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jugador@vault.gg"
                className="h-11 border border-line bg-bg px-3 font-mono outline-none focus:border-cyan focus:shadow-[0_0_12px_rgba(0,245,255,0.35)]"
              />
            </label>
          )}
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              Contraseña
            </span>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              className="h-11 border border-line bg-bg px-3 font-mono outline-none focus:border-cyan focus:shadow-[0_0_12px_rgba(0,245,255,0.35)]"
            />
          </label>

          <Button type="submit" size="lg" className="mt-2 w-full">
            {tab === "in" ? "ENTRAR AL VAULT" : "CREAR Y JUGAR"}
          </Button>
        </form>

        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="mt-2.5 w-full"
          onClick={playAsGuest}
        >
          JUGAR COMO INVITADO
        </Button>

        <div className="my-4 flex items-center gap-3 font-pixel text-[8px] tracking-[0.16em] text-ink-faint before:h-px before:flex-1 before:bg-line before:content-[''] after:h-px after:flex-1 after:bg-line after:content-['']">
          O CONTINÚA CON
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Button type="button" variant="ghost" className="text-[9px]">
            ◆ GOOGLE
          </Button>
          <Button type="button" variant="ghost" className="text-[9px]">
            ▣ GITHUB
          </Button>
        </div>

        <div className="mt-4.5 text-center font-mono text-[11px] tracking-widest text-ink-faint">
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}
