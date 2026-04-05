"use client";

import React from "react";
import type {
  RegionalTemplateProps,
  RegionalSectionProps,
  RegionalSectionType,
} from "@/types/regional-template";

/* ── Section components ────────────────────────────────────────────────────── */
import HeroCultural from "@/components/regional/HeroCultural";
import HeritageStory from "@/components/regional/HeritageStory";
import SignatureOrigin from "@/components/regional/SignatureOrigin";
import ThaliExperience from "@/components/regional/ThaliExperience";
import PrivateDining from "@/components/regional/PrivateDining";
import ChefSpeaks from "@/components/regional/ChefSpeaks";
import WhatsAppOptIn from "@/components/regional/WhatsAppOptIn";

/* ══════════════════════════════════════════════════════════════════════════════
   Component Map — type → variant → component
   ════════════════════════════════════════════════════════════════════════════ */
const componentMap: Record<
  RegionalSectionType,
  Record<string, React.ComponentType<RegionalSectionProps>>
> = {
  hero: { culturalHero: HeroCultural },
  heritage: { storyScroll: HeritageStory },
  signatureDishes: { originCards: SignatureOrigin },
  setMenu: { thaliExperience: ThaliExperience },
  events: { privateDining: PrivateDining },
  chef: { videoStory: ChefSpeaks },
};

/* ══════════════════════════════════════════════════════════════════════════════
   RegionalAuthentic — Main Template
   ════════════════════════════════════════════════════════════════════════════ */
export default function RegionalAuthentic({
  restaurantData,
  menuData,
  config,
  onReserve,
  onEventInquiry,
}: RegionalTemplateProps) {
  const { theme, sections } = config;

  /* CSS custom properties for theming */
  const themeVars = {
    "--reg-primary": theme.primary,
    "--reg-bg": theme.background,
    "--reg-accent": theme.accent,
    "--reg-highlight": theme.highlight,
    "--reg-text": theme.text,
  } as React.CSSProperties;

  return (
    <div style={themeVars} className="relative min-h-screen">
      {/* Warm textured background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundColor: theme.background,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
        }}
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
            onEventInquiry={onEventInquiry}
          />
        );
      })}

      {/* Always-present WhatsApp opt-in */}
      <WhatsAppOptIn restaurantData={restaurantData} theme={theme} />

      {/* Footer */}
      <RegionalFooter restaurantData={restaurantData} theme={theme} />
    </div>
  );
}

/* ── Footer ────────────────────────────────────────────────────────────────── */
function RegionalFooter({
  restaurantData,
  theme,
}: {
  restaurantData: RegionalTemplateProps["restaurantData"];
  theme: RegionalTemplateProps["config"]["theme"];
}) {
  return (
    <footer
      className="border-t px-6 py-12 text-center md:px-12"
      style={{
        backgroundColor: theme.accent,
        borderColor: `${theme.highlight}33`,
        color: `${theme.background}cc`,
      }}
    >
      <p
        className="mb-2 text-2xl font-serif tracking-wide"
        style={{ color: theme.highlight }}
      >
        {restaurantData.name}
      </p>
      <p className="text-sm italic opacity-70">{restaurantData.tagline}</p>
      <div className="mt-6 text-[11px] tracking-widest uppercase opacity-50">
        © {new Date().getFullYear()} {restaurantData.name}. All rights reserved.
      </div>
    </footer>
  );
}
