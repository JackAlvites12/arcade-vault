"use client";

import { useReveal } from "@/app/lib/use-reveal";
import type { Game } from "@/app/data/games";
import {
  HomeHero,
  WhyVaultSection,
  GamesPreviewSection,
  StatsSection,
  LiveActivitySection,
  PricingSection,
  FinalCtaSection,
} from "@/app/components/home-sections";

export function HomeClient({ games }: { games: Game[] }) {
  useReveal(".home-reveal");
  return (
    <div className="fade-in">
      <HomeHero />
      <WhyVaultSection />
      <GamesPreviewSection games={games} />
      <StatsSection games={games} />
      <LiveActivitySection games={games} />
      <PricingSection />
      <FinalCtaSection />
    </div>
  );
}
