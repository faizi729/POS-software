"use client";

import { useEffect, useState } from "react";
import {
  demoFamilyConfig,
  demoFamilyRestaurant,
  demoFamilyMenu,
} from "@/data/demo-family";
import FamilyComfort from "@/templates/FamilyComfort";
import { getTemplateStorageKey } from "@/lib/templates/storage";

export default function FamilyComfortPreview() {
  const [configOverride, setConfigOverride] = useState(demoFamilyConfig);
  const [dataOverride, setDataOverride] = useState(demoFamilyRestaurant);
  const [restaurantId, setRestaurantId] = useState<string>("");

  useEffect(() => {
    try {
      const scopedKey = getTemplateStorageKey("family-comfort", restaurantId);
      const legacyKey = getTemplateStorageKey("family-comfort", null);
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
          ...(r.description && { trustText: r.description }),
          ...(r.heroImage && { heroImage: r.heroImage }),
          ...(r.phone && { phone: r.phone }),
          ...(r.whatsapp && { whatsapp: r.whatsapp }),
          ...(r.location && { address: r.location }),
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
    <FamilyComfort
      restaurantData={dataOverride}
      menuData={demoFamilyMenu}
      config={configOverride}
    />
  );
}
