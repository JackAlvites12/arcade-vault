"use client";

import { useState, type FormEvent } from "react";
import { useReveal } from "@/app/lib/use-reveal";
import { Button } from "@/app/components/button";

const HIGHLIGHTS: Array<{
  icon: "HEART" | "BROWSER" | "PLANT";
  text: string;
  color: "magenta" | "cyan" | "green";
}> = [
  { icon: "HEART", text: "HECHO CON ❤️ PARA JUGADORES", color: "magenta" },
  {
    icon: "BROWSER",
    text: "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR",
    color: "cyan",
  },
  { icon: "PLANT", text: "PROYECTO EN CONSTANTE CRECIMIENTO", color: "green" },
];

function HighlightIcon({
  kind,
}: {
  kind: (typeof HIGHLIGHTS)[number]["icon"];
}) {
  const C = "currentColor";
  if (kind === "HEART")
    return (
      <svg className="hl-icon" viewBox="0 0 16 16">
        <g fill={C}>
          <rect x="2" y="3" width="4" height="2" />
          <rect x="10" y="3" width="4" height="2" />
          <rect x="1" y="4" width="2" height="4" />
          <rect x="13" y="4" width="2" height="4" />
          <rect x="2" y="8" width="2" height="2" />
          <rect x="12" y="8" width="2" height="2" />
          <rect x="3" y="9" width="10" height="2" />
          <rect x="4" y="11" width="8" height="2" />
          <rect x="5" y="12" width="6" height="2" />
          <rect x="6" y="13" width="4" height="1" />
          <rect x="7" y="14" width="2" height="1" />
        </g>
      </svg>
    );
  if (kind === "BROWSER")
    return (
      <svg className="hl-icon" viewBox="0 0 16 16">
        <g fill={C}>
          <rect
            x="1"
            y="2"
            width="14"
            height="12"
            fill="none"
            stroke={C}
            strokeWidth="1.4"
          />
          <rect x="1" y="2" width="14" height="3" />
          <rect x="3" y="3" width="1" height="1" fill="#0a0a0f" />
          <rect x="5" y="3" width="1" height="1" fill="#0a0a0f" />
          <rect x="7" y="3" width="1" height="1" fill="#0a0a0f" />
          <rect x="3" y="7" width="4" height="1" />
          <rect x="3" y="9" width="6" height="1" />
          <rect x="3" y="11" width="3" height="1" />
        </g>
      </svg>
    );
  return (
    <svg className="hl-icon" viewBox="0 0 16 16">
      <g fill={C}>
        <rect x="7" y="2" width="2" height="10" />
        <rect x="4" y="4" width="3" height="2" />
        <rect x="9" y="6" width="3" height="2" />
        <rect x="3" y="3" width="2" height="2" />
        <rect x="11" y="5" width="2" height="2" />
        <rect x="3" y="12" width="10" height="2" />
        <rect x="4" y="14" width="8" height="1" />
      </g>
    </svg>
  );
}

function TerminalBar() {
  return (
    <div className="term-bar">
      <span className="dot r" />
      <span className="dot y" />
      <span className="dot g" />
      <span className="term-title">VAULT-OS // TERMINAL</span>
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "sending" | "success" | "error";

export default function AcercaPage() {
  useReveal(".about-reveal");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [shake, setShake] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();
    if (
      !trimmedName ||
      !trimmedEmail ||
      !trimmedMessage ||
      !EMAIL_RE.test(trimmedEmail)
    ) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          message: trimmedMessage,
          honeypot,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const sendAnother = () => {
    setStatus("idle");
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <div className="fade-in">
      <section className="about-hero">
        <div className="font-pixel text-[11px] tracking-[0.24em] text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.7),0_0_16px_rgba(245,255,0,0.4)]">
          ▸ ACERCA DE
        </div>
        <h1 className="bg-[linear-gradient(180deg,#fff,var(--cyan)_80%)] bg-clip-text font-pixel text-[clamp(26px,5vw,52px)] tracking-[0.06em] text-transparent drop-shadow-[0_0_14px_rgba(0,245,255,0.4)]">
          ACERCA DE ARCADE VAULT
        </h1>
        <p className="about-mission">
          ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra
          misión es preservar y celebrar los arcades que definieron una
          generación, haciéndolos accesibles para todos, en cualquier lugar y
          sin costo.
        </p>

        <div className="highlight-row">
          {HIGHLIGHTS.map((h, i) => (
            <div
              key={h.icon}
              className={`highlight ${h.color}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <HighlightIcon kind={h.icon} />
              <div className="hl-text font-pixel">{h.text}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="about-divider about-reveal" aria-hidden="true">
        <div className="div-bar" />
        <div className="div-pixels">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        <div className="div-bar" />
      </div>

      <section className="about-contact about-reveal">
        <div className="contact-grid">
          <div>
            <div className="font-pixel text-[11px] tracking-[0.24em] text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.65),0_0_16px_rgba(0,245,255,0.45)]">
              ▸ CONTACTO
            </div>
            <h2 className="mt-3.5 font-pixel text-[clamp(22px,3.5vw,36px)] tracking-[0.06em] text-cyan [text-shadow:0_0_12px_rgba(0,245,255,0.4)]">
              CONTÁCTANOS
            </h2>
            <p className="my-4.5 text-sm leading-[1.7] text-ink-dim">
              ¿Tienes alguna sugerencia, quieres proponer un juego, o
              simplemente quieres saludar? Escríbenos.
            </p>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5 font-pixel text-[9px] tracking-[0.14em] text-ink-dim">
                <span className="h-2 w-2 rounded-full bg-green shadow-[0_0_6px_var(--green)]" />
                RESPUESTA EN 24-48H
              </div>
              <div className="flex items-center gap-2.5 font-pixel text-[9px] tracking-[0.14em] text-ink-dim">
                <span className="h-2 w-2 rounded-full bg-yellow shadow-[0_0_6px_var(--yellow)]" />
                SUGERENCIAS BIENVENIDAS
              </div>
              <div className="flex items-center gap-2.5 font-pixel text-[9px] tracking-[0.14em] text-ink-dim">
                <span className="h-2 w-2 rounded-full bg-magenta shadow-[0_0_6px_var(--magenta)]" />
                SIN SPAM, JAMÁS
              </div>
            </div>
          </div>

          <form
            className={`contact-form${shake ? " shake" : ""}`}
            onSubmit={onSubmit}
            noValidate
          >
            <div
              className="absolute left-0 top-0 h-0 w-0 overflow-hidden opacity-0"
              aria-hidden="true"
            >
              <label htmlFor="company">Compañía</label>
              <input
                id="company"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {status === "success" ? (
              <div className="terminal-success">
                <TerminalBar />
                <div className="term-body">
                  <div className="line">
                    <span className="prompt">vault@arcade:~$</span>{" "}
                    ./send_message --to=team
                  </div>
                  <div className="line dim">[OK] Conectando con servidor…</div>
                  <div className="line dim">[OK] Validando contenido…</div>
                  <div className="line dim">[OK] Transmitiendo paquete…</div>
                  <div className="line success">
                    &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS,{" "}
                    {name.trim().toUpperCase()}.
                    <span className="caret">_</span>
                  </div>
                  <div className="mt-4.5">
                    <Button variant="ghost" type="button" onClick={sendAnother}>
                      ENVIAR OTRO MENSAJE
                    </Button>
                  </div>
                </div>
              </div>
            ) : status === "error" ? (
              <div className="terminal-success is-error">
                <TerminalBar />
                <div className="term-body">
                  <div className="line">
                    <span className="prompt">vault@arcade:~$</span>{" "}
                    ./send_message --to=team
                  </div>
                  <div className="line dim">[OK] Conectando con servidor…</div>
                  <div className="line error">
                    [ERROR] Fallo al enviar. Intenta de nuevo.
                  </div>
                  <div className="mt-4.5">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setStatus("idle")}
                    >
                      REINTENTAR
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <label className="mb-3 flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    Nombre
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="px_kai"
                    className="h-11 border border-line bg-bg px-3 font-mono outline-none focus:border-cyan focus:shadow-[0_0_12px_rgba(0,245,255,0.35)]"
                  />
                </label>
                <label className="mb-3 flex flex-col gap-1.5">
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
                <label className="mb-3 flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    Mensaje
                  </span>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Cuéntanos qué tienes en mente…"
                  />
                </label>
                <Button
                  type="submit"
                  size="xl"
                  className="w-full"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? "ENVIANDO…" : "▶ ENVIAR MENSAJE"}
                </Button>
              </>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
