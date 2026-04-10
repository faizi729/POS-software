"use client";

import { useEffect, useState } from "react";
import {
  demoCafeConfig,
  demoCafeRestaurant,
  demoCafeMenu,
} from "@/data/demo-cafe";
import MinimalCafe from "@/templates/MinimalCafe";
import { getTemplateStorageKey } from "@/lib/templates/storage";

export default function MinimalCafePreview() {
  const [configOverride, setConfigOverride] = useState(demoCafeConfig);
  const [dataOverride, setDataOverride] = useState(demoCafeRestaurant);
  const [restaurantId, setRestaurantId] = useState<string>("");

  useEffect(() => {
    try {
      const scopedKey = getTemplateStorageKey("minimal-cafe", restaurantId);
      const legacyKey = getTemplateStorageKey("minimal-cafe", null);
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
          ...(r.heroImage && { heroImage: r.heroImage }),
          ...(r.instagram && { instagramHandle: r.instagram }),
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
    <MinimalCafe
      restaurantData={dataOverride}
      menuData={demoCafeMenu}
      config={configOverride}
    />
  );
}
