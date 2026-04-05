"use client";

import { useEffect, useState } from "react";
import {
  demoConfig,
  demoRestaurantData,
  demoMenuData,
} from "@/data/demo-luxury";
import LuxuryFineDining from "@/templates/LuxuryFineDining";

export default function LuxuryFineDiningPreview() {
  const [configOverride, setConfigOverride] = useState(demoConfig);
  const [dataOverride, setDataOverride] = useState(demoRestaurantData);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("__pos_tpl_luxury-fine-dining");
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
  }, []);

  return (
    <LuxuryFineDining
      restaurantData={dataOverride}
      menuData={demoMenuData}
      config={configOverride}
    />
  );
}
