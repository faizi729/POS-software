"use client";

import { useEffect, useState } from "react";
import {
  demoFamilyConfig,
  demoFamilyRestaurant,
  demoFamilyMenu,
} from "@/data/demo-family";
import FamilyComfort from "@/templates/FamilyComfort";

export default function FamilyComfortPreview() {
  const [configOverride, setConfigOverride] = useState(demoFamilyConfig);
  const [dataOverride, setDataOverride] = useState(demoFamilyRestaurant);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("__pos_tpl_family-comfort");
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
  }, []);

  return (
    <FamilyComfort
      restaurantData={dataOverride}
      menuData={demoFamilyMenu}
      config={configOverride}
    />
  );
}
