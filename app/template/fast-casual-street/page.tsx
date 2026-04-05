"use client";

import { useEffect, useState } from "react";
import {
  demoStreetConfig,
  demoStreetRestaurant,
  demoStreetMenu,
} from "@/data/demo-street";
import FastCasualStreet from "@/templates/FastCasualStreet";

export default function FastCasualStreetPreview() {
  const [configOverride, setConfigOverride] = useState(demoStreetConfig);
  const [dataOverride, setDataOverride] = useState(demoStreetRestaurant);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("__pos_tpl_fast-casual-street");
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
  }, []);

  return (
    <FastCasualStreet
      restaurantData={dataOverride}
      menuData={demoStreetMenu}
      config={configOverride}
    />
  );
}
