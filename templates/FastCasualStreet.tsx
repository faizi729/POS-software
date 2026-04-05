"use client";

import React, { useState, useCallback } from "react";
import type {
  StreetTemplateProps,
  StreetSectionProps,
  StreetSectionType,
  CartItem,
  OrderMode,
  StreetMenuItem,
} from "@/types/street-template";

/* ── Section components ────────────────────────────────────────────────────── */
import HeroStreet from "@/components/street/HeroStreet";
import MenuFilterGrid from "@/components/street/MenuFilterGrid";
import BuildYourOwn from "@/components/street/BuildYourOwn";
import SocialWall from "@/components/street/SocialWall";
import RewardsPunch from "@/components/street/RewardsPunch";
import LocationHours from "@/components/street/LocationHours";
import StickyMobileNav from "@/components/street/StickyMobileNav";

/* ══════════════════════════════════════════════════════════════════════════════
   Component Map — type → variant → component
   ════════════════════════════════════════════════════════════════════════════ */
const componentMap: Record<
  StreetSectionType,
  Record<string, React.ComponentType<StreetSectionProps>>
> = {
  hero: { streetHero: HeroStreet },
  menu: { filterGridStreet: MenuFilterGrid },
  builder: { customBuilder: BuildYourOwn },
  social: { instagramWall: SocialWall },
  rewards: { loyaltyPunch: RewardsPunch },
  location: { mapHours: LocationHours },
};

/* ══════════════════════════════════════════════════════════════════════════════
   FastCasualStreet — Main Template
   ════════════════════════════════════════════════════════════════════════════ */
export default function FastCasualStreet({
  restaurantData,
  menuData,
  config,
}: StreetTemplateProps) {
  const { theme, sections } = config;

  /* ── Cart state ──────────────────────────────────────────────────────── */
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderMode, setOrderMode] = useState<OrderMode>("dine-in");

  const addToCart = useCallback((item: StreetMenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        { id: item.id, name: item.name, price: item.price, quantity: 1, image: item.image },
      ];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === itemId);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter((c) => c.id !== itemId);
      return prev.map((c) =>
        c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c
      );
    });
  }, []);

  const addBuilderItem = useCallback((item: CartItem) => {
    setCart((prev) => [...prev, item]);
  }, []);

  /* ── Theme CSS vars ──────────────────────────────────────────────────── */
  const themeVars = {
    "--st-bg": theme.background,
    "--st-primary": theme.primary,
    "--st-accent": theme.accent,
    "--st-text": theme.text,
  } as React.CSSProperties;

  return (
    <div style={themeVars} className="relative min-h-screen">
      {/* Global background */}
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
            cart={cart}
            onAddToCart={addToCart}
            onRemoveFromCart={removeFromCart}
            onAddBuilderItem={addBuilderItem}
            orderMode={orderMode}
            onOrderModeChange={setOrderMode}
          />
        );
      })}

      {/* Always-present sticky mobile nav */}
      <StickyMobileNav
        theme={theme}
        cart={cart}
      />
    </div>
  );
}
