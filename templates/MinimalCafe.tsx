"use client";

import React from "react";
import type {
  CafeTemplateProps,
  CafeSectionProps,
  CafeSectionType,
} from "@/types/cafe-template";

/* ── Section components ────────────────────────────────────────────────────── */
import HeroSplit from "@/components/cafe/HeroSplit";
import SeasonalMenu from "@/components/cafe/SeasonalMenu";
import SpaceGallery from "@/components/cafe/SpaceGallery";
import SubscriptionPlans from "@/components/cafe/SubscriptionPlans";
import EventsCalendar from "@/components/cafe/EventsCalendar";
import GiftCards from "@/components/cafe/GiftCards";
import MobileMenuSheet from "@/components/cafe/MobileMenuSheet";

/* ══════════════════════════════════════════════════════════════════════════════
   Component Map — type → variant → component
   ════════════════════════════════════════════════════════════════════════════ */
const componentMap: Record<
  CafeSectionType,
  Record<string, React.ComponentType<CafeSectionProps>>
> = {
  hero: { splitMinimal: HeroSplit },
  menu: { seasonalGrid: SeasonalMenu },
  space: { interactiveGallery: SpaceGallery },
  subscription: { coffeePlans: SubscriptionPlans },
  events: { calendarCards: EventsCalendar },
  gift: { giftFlow: GiftCards },
};

/* ══════════════════════════════════════════════════════════════════════════════
   MinimalCafe — Main Template
   ════════════════════════════════════════════════════════════════════════════ */
export default function MinimalCafe({
  restaurantData,
  menuData,
  config,
  onGiftCard,
}: CafeTemplateProps) {
  const { theme, sections } = config;

  const themeVars = {
    "--cafe-bg": theme.background,
    "--cafe-primary": theme.primary,
    "--cafe-accent": theme.accent,
    "--cafe-text": theme.text,
    "--space-sm": "1rem",
    "--space-md": "2rem",
    "--space-lg": "4rem",
    "--space-xl": "6rem",
    "--space-2xl": "8rem",
  } as React.CSSProperties;

  return (
    <div style={themeVars} className="relative min-h-screen">
      {/* Calm background with grain texture */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundColor: theme.background,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.025'/%3E%3C/svg%3E")`,
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
            onGiftCard={onGiftCard}
          />
        );
      })}

      {/* Footer — Instagram grid */}
      <CafeFooter restaurantData={restaurantData} theme={theme} />

      {/* Mobile menu bottom sheet */}
      <MobileMenuSheet menuData={menuData} theme={theme} />
    </div>
  );
}

/* ── Footer with Instagram grid ────────────────────────────────────────────── */
function CafeFooter({
  restaurantData,
  theme,
}: {
  restaurantData: CafeTemplateProps["restaurantData"];
  theme: CafeTemplateProps["config"]["theme"];
}) {
  const images = restaurantData.instagramImages;
  if (!images || images.length === 0) return null;

  return (
    <footer
      className="border-t"
      style={{
        backgroundColor: theme.background,
        borderColor: `${theme.text}10`,
      }}
    >
      {/* Instagram label */}
      <div className="px-6 pb-6 pt-10 text-center md:px-12">
        <a
          href={
            restaurantData.instagramHandle
              ? `https://instagram.com/${restaurantData.instagramHandle}`
              : "#"
          }
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
          style={{ color: `${theme.text}77` }}
        >
          @{restaurantData.instagramHandle ?? restaurantData.name.toLowerCase().replace(/\s+/g, "")}
        </a>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-px sm:grid-cols-4 md:grid-cols-6">
        {images.slice(0, 6).map((img) => (
          <a
            key={img.id}
            href={img.link ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden"
          >
            <img
              src={img.src}
              alt={img.alt}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ backgroundColor: `${theme.text}15` }}
            />
          </a>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        className="border-t px-6 py-6 text-center text-[11px] tracking-widest"
        style={{
          borderColor: `${theme.text}10`,
          color: `${theme.text}55`,
        }}
      >
        © {new Date().getFullYear()} {restaurantData.name}
      </div>
    </footer>
  );
}
