"use client";

import { useEffect, useState } from "react";
import {
  demoConfig,
  demoRestaurantData,
  demoMenuData,
} from "@/data/demo-luxury";
import LuxuryFineDining from "@/templates/LuxuryFineDining";
import { getTemplateStorageKey } from "@/lib/templates/storage";

export default function LuxuryFineDiningPreview() {
  const [configOverride, setConfigOverride] = useState(demoConfig);
  const [dataOverride, setDataOverride] = useState(demoRestaurantData);
  const [restaurantId, setRestaurantId] = useState<string>("");

  useEffect(() => {
    try {
      const scopedKey = getTemplateStorageKey("luxury-fine-dining", restaurantId);
      const legacyKey = getTemplateStorageKey("luxury-fine-dining", null);
      const raw = localStorage.getItem(scopedKey) || localStorage.getItem(legacyKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        theme?: Record<string, string>;
        restaurant?: Record<string, string>;
      };

      if (parsed.theme) {
        setConfigOverride((prev) => ({
          ...prev,
          theme: { ...prev.theme, ...parsed.theme },
        }));
      }

      if (parsed.restaurant) {
        const r = parsed.restaurant;
        setDataOverride((prev) => ({
          ...prev,
          ...(r.name && { name: r.name }),
          ...(r.tagline && { tagline: r.tagline }),
          ...(r.description && { description: r.description }),
          ...(r.heroImage && { heroPoster: r.heroImage }),
          ...(r.aboutImage && { chef: { ...prev.chef, image: r.aboutImage } }),
          ...(r.phone && { phone: r.phone }),
          ...(r.whatsapp && { whatsapp: r.whatsapp }),
          ...(r.location && { location: r.location }),
        }));
      }
    } catch {
      // ignore parse errors
    }
  }, [restaurantId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/restaurant/config", { credentials: "include" });
        if (!res.ok) return;
        const json = await res.json();
        const rid = json?.data?.restaurant?.id ?? json?.restaurant?.id ?? "";
        if (!cancelled && rid) setRestaurantId(String(rid));
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <LuxuryFineDining
      restaurantData={dataOverride}
      menuData={demoMenuData}
      config={configOverride}
    />
  );
}
