"use client";

import React from "react";
import type {
  LuxuryTemplateProps,
  LuxurySectionProps,
  SectionType,
} from "@/types/luxury-template";

/* ── Lazy-loaded section components ────────────────────────────────────────── */
import HeroLuxury from "@/components/luxury/HeroLuxury";
import SignatureCarousel from "@/components/luxury/SignatureCarousel";
import ChefStory from "@/components/luxury/ChefStory";
import GalleryMasonry from "@/components/luxury/GalleryMasonry";
import TestimonialsLuxury from "@/components/luxury/TestimonialsLuxury";
import ReservationForm from "@/components/luxury/ReservationForm";
import StickyMobileBar from "@/components/luxury/StickyMobileBar";

/* ══════════════════════════════════════════════════════════════════════════════
   Component Map — variant → component lookup
   ════════════════════════════════════════════════════════════════════════════ */
const componentMap: Record<
  SectionType,
  Record<string, React.ComponentType<LuxurySectionProps>>
> = {
  hero: {
    videoLuxury: HeroLuxury,
  },
  signatureDishes: {
    carouselLuxury: SignatureCarousel,
  },
  chefStory: {
    splitLuxury: ChefStory,
  },
  gallery: {
    masonryLuxury: GalleryMasonry,
  },
  testimonials: {
    luxuryQuotes: TestimonialsLuxury,
  },
  reservation: {
    inlineLuxury: ReservationForm,
  },
};

/* ══════════════════════════════════════════════════════════════════════════════
   LuxuryFineDining — Main Template
   ════════════════════════════════════════════════════════════════════════════ */
export default function LuxuryFineDining({
  restaurantData,
  menuData,
  config,
  onReserve,
}: LuxuryTemplateProps) {
  const { theme, sections } = config;

  /* Apply theme as CSS custom properties on the template root */
  const themeVars = {
    "--lux-primary": theme.primary,
    "--lux-bg": theme.background,
    "--lux-text": theme.text,
  } as React.CSSProperties;

  return (
    <div style={themeVars} className="relative min-h-screen font-serif">
      {/* Global template background */}
      <div
        className="fixed inset-0 -z-10"
        style={{ backgroundColor: theme.background }}
      />

      {/* Dynamic section renderer */}
      {sections.map((section, idx) => {
        const variantMap = componentMap[section.type];
        if (!variantMap) return null;

        const Component = variantMap[section.variant];
        if (!Component) return null;

        return (
          <Component
            key={`${section.type}-${idx}`}
            restaurantData={restaurantData}
            menuData={menuData}
            theme={theme}
            onReserve={onReserve}
          />
        );
      })}

      {/* Always-present mobile sticky bar */}
      <StickyMobileBar
        restaurantData={restaurantData}
        theme={theme}
      />
    </div>
  );
}
