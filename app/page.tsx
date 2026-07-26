"use client";

import { useReveal } from "@/app/lib/use-reveal";
import {
  HomeHero,
  WhyVaultSection,
  GamesPreviewSection,
  StatsSection,
  LiveActivitySection,
  PricingSection,
  FinalCtaSection,
} from "@/app/components/home-sections";

export default function Home() {
  useReveal(".home-reveal");
  return (
    <div className="fade-in">
      <HomeHero />
      <WhyVaultSection />
      <GamesPreviewSection />
      <StatsSection />
      <LiveActivitySection />
      <PricingSection />
      <FinalCtaSection />
    </div>
  );
}
