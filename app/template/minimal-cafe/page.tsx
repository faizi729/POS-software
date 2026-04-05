"use client";

import { useEffect, useState } from "react";
import {
  demoCafeConfig,
  demoCafeRestaurant,
  demoCafeMenu,
} from "@/data/demo-cafe";
import MinimalCafe from "@/templates/MinimalCafe";

export default function MinimalCafePreview() {
  const [configOverride, setConfigOverride] = useState(demoCafeConfig);
  const [dataOverride, setDataOverride] = useState(demoCafeRestaurant);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("__pos_tpl_minimal-cafe");
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
  }, []);

  return (
    <MinimalCafe
      restaurantData={dataOverride}
      menuData={demoCafeMenu}
      config={configOverride}
    />
  );
}
