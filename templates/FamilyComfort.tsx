"use client";

import React from "react";
import type {
  FamilyTemplateProps,
  FamilySectionProps,
  FamilySectionType,
} from "@/types/family-template";

/* ── Section components ────────────────────────────────────────────────────── */
import HeroFamily from "@/components/family/HeroFamily";
import TodaySpecial from "@/components/family/TodaySpecial";
import StoryTimeline from "@/components/family/StoryTimeline";
import MenuOccasionTabs from "@/components/family/MenuOccasionTabs";
import CateringForm from "@/components/family/CateringForm";
import CommunitySection from "@/components/family/CommunitySection";
import StickyMobileActions from "@/components/family/StickyMobileActions";

/* ══════════════════════════════════════════════════════════════════════════════
   Component Map — type → variant → component
   ════════════════════════════════════════════════════════════════════════════ */
const componentMap: Record<
  FamilySectionType,
  Record<string, React.ComponentType<FamilySectionProps>>
> = {
  hero: { familyHero: HeroFamily },
  todaySpecial: { storyCard: TodaySpecial },
  story: { timelineWarm: StoryTimeline },
  menu: { occasionTabs: MenuOccasionTabs },
  catering: { simpleForm: CateringForm },
  community: { eventsWarm: CommunitySection },
};

/* ══════════════════════════════════════════════════════════════════════════════
   FamilyComfort — Main Template
   ════════════════════════════════════════════════════════════════════════════ */
export default function FamilyComfort({
  restaurantData,
  menuData,
  config,
  onCateringInquiry,
}: FamilyTemplateProps) {
  const { theme, sections } = config;

  const themeVars = {
    "--fm-primary": theme.primary,
    "--fm-bg": theme.background,
    "--fm-accent": theme.accent,
    "--fm-text": theme.text,
  } as React.CSSProperties;

  return (
    <div style={themeVars} className="relative min-h-screen">
      {/* Warm textured background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundColor: theme.background,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
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
            onCateringInquiry={onCateringInquiry}
          />
        );
      })}

      {/* Always-present mobile sticky actions */}
      <StickyMobileActions
        restaurantData={restaurantData}
        theme={theme}
      />
    </div>
  );
}
