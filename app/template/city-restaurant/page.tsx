"use client";

import { useEffect, useState } from "react";
import {
  demoCityConfig,
  demoCityRestaurant,
  demoCityMenu,
} from "@/data/demo-city-restaurant";
import CityRestaurant from "@/templates/CityRestaurant";

export default function CityRestaurantPreview() {
  const [configOverride, setConfigOverride] = useState(demoCityConfig);
  const [dataOverride, setDataOverride] = useState(demoCityRestaurant);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("__pos_tpl_city-restaurant");
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
          ...(r.heroImage && { heroImage: r.heroImage }),
          ...(r.aboutImage && { aboutImage: r.aboutImage }),
          ...(r.phone && { phone: r.phone }),
          ...(r.whatsapp && { whatsapp: r.whatsapp }),
          ...(r.location && { location: r.location }),
          openingHours: {
            weekdays: r.weekdayHours || prev.openingHours.weekdays,
            weekends: r.weekendHours || prev.openingHours.weekends,
          },
          socialLinks: {
            ...(prev.socialLinks || {}),
            ...(r.instagram !== undefined && { instagram: r.instagram }),
            ...(r.facebook !== undefined && { facebook: r.facebook }),
            ...(r.twitter !== undefined && { twitter: r.twitter }),
            ...(r.youtube !== undefined && { youtube: r.youtube }),
          },
        }));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  return (
    <CityRestaurant
      restaurantData={dataOverride}
      menuData={demoCityMenu}
      config={configOverride}
    />
  );
}
