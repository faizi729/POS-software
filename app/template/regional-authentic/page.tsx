"use client";

import { useEffect, useState } from "react";
import {
  demoRegionalConfig,
  demoRegionalRestaurant,
  demoRegionalMenu,
} from "@/data/demo-regional";
import RegionalAuthentic from "@/templates/RegionalAuthentic";

export default function RegionalAuthenticPreview() {
  const [configOverride, setConfigOverride] = useState(demoRegionalConfig);
  const [dataOverride, setDataOverride] = useState(demoRegionalRestaurant);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("__pos_tpl_regional-authentic");
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
          ...(r.phone && { phone: r.phone }),
          ...(r.whatsapp && { whatsapp: r.whatsapp }),
        }));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  return (
    <RegionalAuthentic
      restaurantData={dataOverride}
      menuData={demoRegionalMenu}
      config={configOverride}
    />
  );
}
