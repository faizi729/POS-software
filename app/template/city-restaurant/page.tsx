"use client";

import { useEffect, useState } from "react";
import {
  demoCityConfig,
  demoCityRestaurant,
  demoCityMenu,
} from "@/data/demo-city-restaurant";
import CityRestaurant from "@/templates/CityRestaurant";
import type { CityMenuData } from "@/types/city-restaurant-template";
import { getTemplateStorageKey } from "@/lib/templates/storage";

function mapCategoryToCityKey(slugOrName: string): CityMenuData["items"][number]["category"] {
  const s = (slugOrName || "").toLowerCase();
  if (s.includes("starter") || s.includes("appet") || s.includes("small")) return "starters";
  if (s.includes("main") || s.includes("entree") || s.includes("lunch") || s.includes("dinner")) return "mains";
  if (s.includes("dessert") || s.includes("sweet")) return "desserts";
  if (s.includes("drink") || s.includes("beverage") || s.includes("juice") || s.includes("coffee") || s.includes("tea") || s.includes("bar")) return "drinks";
  return "mains";
}

export default function CityRestaurantPreview() {
  const [configOverride, setConfigOverride] = useState(demoCityConfig);
  const [dataOverride, setDataOverride] = useState(demoCityRestaurant);
  const [menuOverride, setMenuOverride] = useState<CityMenuData | null>(null);
  const [restaurantId, setRestaurantId] = useState<string>("");

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

    try {
      // restaurant-scoped key (fallback to legacy for back-compat)
      const scopedKey = getTemplateStorageKey("city-restaurant", restaurantId);
      const legacyKey = getTemplateStorageKey("city-restaurant", null);
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
          ...(r.description && { description: r.description }),
          ...(r.heroImage && { heroImage: r.heroImage }),
          ...(r.aboutImage && { aboutImage: r.aboutImage }),
          ...(Array.isArray((r as any).gallery) && { gallery: (r as any).gallery }),
          ...(Array.isArray((r as any).features) && { features: (r as any).features }),
          ...((r as any).rating != null && { rating: Number((r as any).rating) || prev.rating }),
          ...((r as any).reviews != null && { reviews: Number((r as any).reviews) || prev.reviews }),
          ...((r as any).established && { established: String((r as any).established) }),
          ...((r as any).stats && { stats: { ...prev.stats, ...(r as any).stats } }),
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
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const liveMenu = url.searchParams.get("liveMenu") === "1";
    if (!liveMenu) return;

    const ctrl = new AbortController();

    (async () => {
      try {
        const [catsRes, itemsRes] = await Promise.all([
          fetch("/api/menu/categories?limit=2000", {
            method: "GET",
            credentials: "include",
            signal: ctrl.signal,
            headers: { "Cache-Control": "no-cache" },
          }),
          fetch("/api/menu/items?limit=2000", {
            method: "GET",
            credentials: "include",
            signal: ctrl.signal,
            headers: { "Cache-Control": "no-cache" },
          }),
        ]);

        if (!catsRes.ok || !itemsRes.ok) return;

        const catsJson = await catsRes.json();
        const itemsJson = await itemsRes.json();

        const categories: Array<{ id: string; name: string; slug: string }> =
          catsJson?.data?.categories ?? catsJson?.categories ?? [];
        const items: Array<{
          id: string;
          name: string;
          description?: string;
          imageUrl?: string;
          price?: number;
          categoryId?: string;
        }> = itemsJson?.data?.items ?? itemsJson?.items ?? [];

        const categoryIdToKey = new Map<string, CityMenuData["items"][number]["category"]>();
        for (const c of categories) {
          categoryIdToKey.set(c.id, mapCategoryToCityKey(c.slug || c.name));
        }

        const mapped: CityMenuData = {
          items: items.map((it) => ({
            id: it.id,
            name: it.name,
            description: it.description ?? "",
            price: Number(it.price ?? 0),
            currency: "₹",
            image:
              (it.imageUrl && it.imageUrl.trim()) ||
              "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600",
            category: categoryIdToKey.get(it.categoryId || "") ?? "mains",
          })),
        };

        // If menu is empty for the restaurant, keep demo to avoid a blank template.
        if (mapped.items.length > 0) setMenuOverride(mapped);
      } catch {
        // ignore fetch errors; fallback to demo menu
      }
    })();

    return () => ctrl.abort();
  }, []);

  return (
    <CityRestaurant
      restaurantData={dataOverride}
      menuData={menuOverride ?? demoCityMenu}
      config={configOverride}
    />
  );
}
