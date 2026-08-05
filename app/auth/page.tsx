"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { useSession } from "@/app/session-context";
import { Button } from "@/app/components/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function mapAuthError(error: AuthError): string {
  switch (error.message) {
    case "Invalid login credentials":
      return "Credenciales inválidas";
    case "User already registered":
      return "Ese correo ya está registrado";
    case "Email not confirmed":
      return "Confirma tu correo antes de iniciar sesión";
    default:
      return error.message;
  }
}

export default function AuthPage() {
  const [tab, setTab] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { user } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/biblioteca");
  }, [user, router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const supabase = getSupabaseBrowserClient();

    if (tab === "in") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) {
        setError(mapAuthError(error));
        return;
      }
      router.push("/biblioteca");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { name } },
      });
      if (error) {
        setError(mapAuthError(error));
        return;
      }
      setNotice("Revisa tu correo para confirmar tu cuenta.");
    }
  };

  const loginWithOAuth = (provider: "google" | "github") => {
    setError(null);
    getSupabaseBrowserClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const playAsGuest = () => {
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
            onClick={() => {
              setTab("in");
              setError(null);
              setNotice(null);
            }}
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
            onClick={() => {
              setTab("up");
              setError(null);
              setNotice(null);
            }}
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
          {tab === "up" && (
            <label className="slide-in flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                Usuario
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="px_kai"
                className="h-11 border border-line bg-bg px-3 font-mono outline-none focus:border-cyan focus:shadow-[0_0_12px_rgba(0,245,255,0.35)]"
              />
            </label>
          )}
          <label className="flex flex-col gap-1.5">
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

          {error && (
            <div className="font-mono text-[11px] tracking-wide text-magenta">
              {error}
            </div>
          )}
          {notice && (
            <div className="font-mono text-[11px] tracking-wide text-cyan">
              {notice}
            </div>
          )}

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
          <Button
            type="button"
            variant="ghost"
            className="text-[9px]"
            onClick={() => loginWithOAuth("google")}
          >
            ◆ GOOGLE
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-[9px]"
            onClick={() => loginWithOAuth("github")}
          >
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
