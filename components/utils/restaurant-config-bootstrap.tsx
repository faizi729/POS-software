"use client";

import { useEffect } from "react";
import { useRestaurantConfigStore } from "@/store/restaurant-config-store";

function setCssVar(name: string, value?: string) {
  if (!value) return;
  document.documentElement.style.setProperty(name, value);
}

export function RestaurantConfigBootstrap() {
  const setRestaurant = useRestaurantConfigStore((s) => s.setRestaurant);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/restaurant/config", {
          method: "GET",
          credentials: "include",
          headers: { "Cache-Control": "no-cache" }
        });
        if (!res.ok) return;
        const json = await res.json();
        const restaurant = json?.data?.restaurant ?? json?.restaurant;
        if (!restaurant || cancelled) return;

        setRestaurant(restaurant);

        // Map tenant theme into global design tokens (used by Tailwind via CSS vars)
        const theme = restaurant.theme || {};
        setCssVar("--accent-primary", theme.primary);
        setCssVar("--accent-secondary", theme.accent);
        setCssVar("--bg-canvas", theme.background);
        setCssVar("--text-primary", theme.text);
        // Optional: font token (project uses --font-sans in globals.css)
        if (theme.font) {
          document.documentElement.style.setProperty("--font-sans", theme.font);
        }
      } catch {
        // ignore: fallback to defaults
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setRestaurant]);

  return null;
}

