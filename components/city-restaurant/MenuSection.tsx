"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  CityRestaurantSectionProps,
} from "@/types/city-restaurant-template";

type PublicCategory = { id: string; name: string; slug: string };

/* ══════════════════════════════════════════════════════════════════════════════
   MenuSection — Category filters + responsive grid
   ════════════════════════════════════════════════════════════════════════════ */
export default function MenuSection({
  menuData,
  theme,
}: CityRestaurantSectionProps) {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [items, setItems] = useState(menuData.items);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [source, setSource] = useState<"public" | "demo">("demo");

  const activeLabel = useMemo(() => {
    if (activeCategoryId === "all") return "All";
    return categories.find((c) => c.id === activeCategoryId)?.name ?? "Category";
  }, [activeCategoryId, categories]);

  async function loadPage(opts?: { reset?: boolean }) {
    if (loading) return;
    setLoading(true);
    try {
      const limit = 20;
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      if (activeCategoryId !== "all") params.set("categoryId", activeCategoryId);
      if (!opts?.reset && cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/public/menu/items?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) return;
      const json = await res.json();
      const dataItems = json?.data?.items ?? json?.items ?? [];
      const page = json?.data?.page ?? json?.page ?? {};

      // If tenant has no items, keep demo to avoid a blank section.
      if (!Array.isArray(dataItems) || dataItems.length === 0) return;

      const mapped = dataItems.map((it: any) => ({
        id: it.id,
        name: it.name,
        description: it.description ?? "",
        price: Number(it.price ?? 0),
        currency: "₹",
        image:
          (it.imageUrl && it.imageUrl.trim()) ||
          "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600",
        // category is only used for demo filters; in public mode we filter server-side
        category: "mains" as any,
      }));

      setItems((prev) => (opts?.reset ? mapped : [...prev, ...mapped]));
      setCursor(page?.nextCursor ?? null);
      setHasMore(Boolean(page?.hasMore));
      setSource("public");
    } finally {
      setLoading(false);
    }
  }

  // Fetch real categories once (public website categories)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/public/menu/categories?limit=200", {
          method: "GET",
          credentials: "include",
          headers: { "Cache-Control": "no-cache" },
        });
        if (!res.ok) return;
        const json = await res.json();
        const cats = (json?.data?.categories ?? json?.categories ?? []) as PublicCategory[];
        if (!cancelled && Array.isArray(cats) && cats.length > 0) {
          setCategories(cats);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Always try to load real items on mount (and on category change). Categories may be empty for some tenants.
  useEffect(() => {
    setItems([]);
    setCursor(null);
    setHasMore(false);
    void loadPage({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategoryId]);

  const filtered = source === "public" ? items : items;

  return (
    <section id="menu" className="relative py-20 md:py-28">
      {/* Section heading */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8 }}
        className="mb-12 px-6 text-center md:px-12"
      >
        <p
          className="mb-3 text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: theme.accent }}
        >
          Our Menu
        </p>
        <h2
          className="font-serif text-3xl font-bold md:text-5xl"
          style={{ color: theme.text }}
        >
          Culinary Masterpieces
        </h2>
      </motion.div>

      {/* Filter tabs */}
      <div className="mb-10 flex flex-wrap justify-center gap-2 px-6 md:gap-3">
        <button
          key="all"
          onClick={() => setActiveCategoryId("all")}
          className="rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300"
          style={{
            backgroundColor: activeCategoryId === "all" ? theme.primary : `${theme.text}0a`,
            color: activeCategoryId === "all" ? "#fff" : `${theme.text}99`,
          }}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryId(cat.id)}
            className="rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300"
            style={{
              backgroundColor:
                activeCategoryId === cat.id ? theme.primary : `${theme.text}0a`,
              color: activeCategoryId === cat.id ? "#fff" : `${theme.text}99`,
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="mx-auto grid max-w-6xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3 md:px-12">
        <AnimatePresence mode="popLayout">
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="group overflow-hidden rounded-2xl border transition-shadow duration-300 hover:shadow-xl hover:shadow-black/30"
              style={{
                borderColor: `${theme.text}10`,
                backgroundColor: `${theme.text}06`,
              }}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                {/* Badge */}
                {item.badge && (
                  <div
                    className="absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor:
                        item.badge === "bestseller"
                          ? theme.primary
                          : theme.accent,
                      color:
                        item.badge === "bestseller" ? "#fff" : theme.background,
                    }}
                  >
                    {item.badge === "bestseller" ? "★ Bestseller" : "👨‍🍳 Chef's Pick"}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3
                    className="font-serif text-lg font-bold"
                    style={{ color: theme.text }}
                  >
                    {item.name}
                  </h3>
                  <span
                    className="flex-shrink-0 font-serif text-lg font-bold"
                    style={{ color: theme.accent }}
                  >
                    {item.currency ?? "₹"}{item.price}
                  </span>
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: `${theme.text}66` }}
                >
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {source === "public" ? (
        <div className="mt-10 flex justify-center px-6 md:px-12">
          <button
            onClick={() => loadPage()}
            disabled={!hasMore || loading}
            className="rounded-full px-6 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 disabled:opacity-50"
            style={{
              backgroundColor: `${theme.text}0a`,
              color: `${theme.text}cc`,
              border: `1px solid ${theme.text}14`,
            }}
            title={activeLabel}
          >
            {loading ? "Loading…" : hasMore ? "Load more" : "End of menu"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
