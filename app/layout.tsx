import type { Metadata } from "next";
import {
  Press_Start_2P,
  JetBrains_Mono,
  Courier_Prime,
} from "next/font/google";
import "./globals.css";
import { SessionProvider } from "./session-context";
import { Nav } from "./components/nav";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const courierPrime = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-courier-prime",
});

export const metadata: Metadata = {
  title: "Arcade Vault",
  description:
    "Plataforma retro arcade: juega en línea y compite en el salón de la fama.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${pixelFont.variable} ${jetbrainsMono.variable} ${courierPrime.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="av-bg" />
        <div className="av-noise" />
        <SessionProvider>
          <Nav />
          <main className="av-main flex-1 relative z-2">{children}</main>
          <footer className="relative z-2 border-t border-line px-8 py-5 text-center text-ink-faint font-mono text-[11px] tracking-[0.16em]">
            © 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
