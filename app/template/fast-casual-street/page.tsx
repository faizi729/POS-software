"use client";

import { useEffect, useState } from "react";
import {
  demoStreetConfig,
  demoStreetRestaurant,
  demoStreetMenu,
} from "@/data/demo-street";
import FastCasualStreet from "@/templates/FastCasualStreet";
import { getTemplateStorageKey } from "@/lib/templates/storage";

export default function FastCasualStreetPreview() {
  const [configOverride, setConfigOverride] = useState(demoStreetConfig);
  const [dataOverride, setDataOverride] = useState(demoStreetRestaurant);
  const [restaurantId, setRestaurantId] = useState<string>("");

  useEffect(() => {
    try {
      const scopedKey = getTemplateStorageKey("fast-casual-street", restaurantId);
      const legacyKey = getTemplateStorageKey("fast-casual-street", null);
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
          ...(r.description && { subheading: r.description }),
          ...(r.heroImage && { heroImage: r.heroImage }),
          ...(r.phone && { phone: r.phone }),
          ...(r.whatsapp && { whatsapp: r.whatsapp }),
          ...(r.location && {
            location: { ...prev.location, address: r.location },
          }),
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
    <FastCasualStreet
      restaurantData={dataOverride}
      menuData={demoStreetMenu}
      config={configOverride}
    />
  );
}
