"use client";

import React from "react";
import type {
  CityRestaurantTemplateProps,
  CityRestaurantSectionProps,
  CityRestaurantSectionType,
} from "@/types/city-restaurant-template";

/* ── Section components ────────────────────────────────────────────────────── */
import Hero from "@/components/city-restaurant/Hero";
import StatsBar from "@/components/city-restaurant/StatsBar";
import MenuSection from "@/components/city-restaurant/MenuSection";
import AboutSection from "@/components/city-restaurant/AboutSection";
import Gallery from "@/components/city-restaurant/Gallery";
import Testimonials from "@/components/city-restaurant/Testimonials";
import ReservationForm from "@/components/city-restaurant/ReservationForm";
import InfoStrip from "@/components/city-restaurant/InfoStrip";

/* ── Always-present components ─────────────────────────────────────────────── */
import Navbar from "@/components/city-restaurant/Navbar";
import FooterSection from "@/components/city-restaurant/FooterSection";
import FloatingUI from "@/components/city-restaurant/FloatingUI";

/* ══════════════════════════════════════════════════════════════════════════════
   Component Map — type → variant → component
   ════════════════════════════════════════════════════════════════════════════ */
const componentMap: Record<
  CityRestaurantSectionType,
  Record<string, React.ComponentType<CityRestaurantSectionProps>>
> = {
  hero: { fullBleed: Hero },
  stats: { animatedBar: StatsBar },
  menu: { filterGrid: MenuSection },
  about: { splitLayout: AboutSection },
  gallery: { gridModal: Gallery },
  testimonials: { carousel: Testimonials },
  reservation: { inlineForm: ReservationForm },
  info: { contactStrip: InfoStrip },
};

/* ══════════════════════════════════════════════════════════════════════════════
   CityRestaurant — Main Template
   ════════════════════════════════════════════════════════════════════════════ */
export default function CityRestaurant({
  restaurantData,
  menuData,
  config,
  onReserve,
}: CityRestaurantTemplateProps) {
  const { theme, sections } = config;

  const themeVars = {
    "--city-primary": theme.primary,
    "--city-accent": theme.accent,
    "--city-bg": theme.background,
    "--city-text": theme.text,
  } as React.CSSProperties;

  return (
    <div style={themeVars} className="relative min-h-screen font-sans">
      {/* Dark background */}
      <div
        className="fixed inset-0 -z-10"
        style={{ backgroundColor: theme.background }}
      />

      {/* Fixed navbar */}
      <Navbar restaurantData={restaurantData} theme={theme} />

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

      {/* Footer */}
      <FooterSection restaurantData={restaurantData} theme={theme} />

      {/* Floating UI — WhatsApp, Back to Top, Cookie */}
      <FloatingUI restaurantData={restaurantData} theme={theme} />
    </div>
  );
}
