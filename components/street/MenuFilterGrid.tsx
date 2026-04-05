"use client";

import React, { useRef, useMemo, useState } from "react";
import { motion, useInView } from "framer-motion";
import type { StreetSectionProps, StreetMenuItem } from "@/types/street-template";

/* ══════════════════════════════════════════════════════════════════════════════
   MenuFilterGrid — Filter tabs + responsive grid of menu cards
   ════════════════════════════════════════════════════════════════════════════ */
const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "bestseller", label: "🔥 Bestseller" },
  { key: "veg", label: "🌱 Veg" },
  { key: "non-veg", label: "🍗 Non-Veg" },
];

/* Spice level indicator */
function SpiceLevel({ level, accent }: { level: number; accent: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="h-1.5 w-3 rounded-full transition-colors"
          style={{
            backgroundColor: i < level ? accent : `${accent}25`,
          }}
        />
      ))}
    </div>
  );
}

export default function MenuFilterGrid({
  menuData,
  theme,
  cart,
  onAddToCart,
  onRemoveFromCart,
}: StreetSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });
  const [activeFilter, setActiveFilter] = useState("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const items = menuData.items;

  const filtered = useMemo(() => {
    if (activeFilter === "all") return items;
    return items.filter((item) => item.tags.includes(activeFilter));
  }, [items, activeFilter]);

  /* Get quantity of item in cart */
  const getQty = (id: string) => cart.find((c) => c.id === id)?.quantity ?? 0;

  return (
    <section
      id="menu"
      ref={sectionRef}
      className="relative py-16 md:py-24"
      style={{ backgroundColor: theme.background }}
    >
      {/* ── Section heading ────────────────────────────────────────────── */}
      <motion.div
        className="mb-10 px-6 text-center md:px-12"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <p
          className="mb-2 text-xs font-bold uppercase tracking-[0.3em]"
          style={{ color: theme.primary }}
        >
          The Menu
        </p>
        <h2
          className="text-3xl font-black uppercase tracking-tight md:text-5xl"
          style={{ color: theme.text }}
        >
          Pick Your Poison
        </h2>
      </motion.div>

      {/* ── Filter tabs ────────────────────────────────────────────────── */}
      <div className="no-scrollbar mb-10 flex gap-3 overflow-x-auto px-6 md:justify-center md:px-12">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className="shrink-0 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200"
            style={{
              backgroundColor:
                activeFilter === tab.key ? theme.primary : `${theme.text}10`,
              color:
                activeFilter === tab.key ? theme.background : `${theme.text}88`,
              border: `1px solid ${activeFilter === tab.key ? theme.primary : `${theme.text}15`}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────── */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-6 sm:grid-cols-2 md:px-12 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((item: StreetMenuItem, idx: number) => {
          const qty = getQty(item.id);
          const isHovered = hoveredId === item.id;

          return (
            <motion.div
              key={item.id}
              className="group relative overflow-hidden rounded-2xl"
              style={{
                backgroundColor: `${theme.text}08`,
                border: `1px solid ${theme.text}10`,
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.5,
                delay: idx * 0.06,
                ease: "easeOut",
              }}
              whileHover={{ scale: 1.02 }}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />

                {/* Tags */}
                <div className="absolute left-3 top-3 flex gap-1.5">
                  {item.tags.includes("bestseller") && (
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: theme.accent,
                        color: theme.text,
                      }}
                    >
                      🔥 Best
                    </span>
                  )}
                  {item.tags.includes("veg") && (
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
                      style={{
                        backgroundColor: "#22c55e",
                        color: "#000",
                      }}
                    >
                      VEG
                    </span>
                  )}
                </div>

                {/* ── Hover slide-up panel (calories + allergens) ──────── */}
                <motion.div
                  className="absolute inset-x-0 bottom-0 px-4 py-3"
                  style={{ backgroundColor: `${theme.background}ee` }}
                  initial={{ y: "100%" }}
                  animate={{ y: isHovered ? 0 : "100%" }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    {item.calories && (
                      <span style={{ color: `${theme.text}88` }}>
                        🔋 {item.calories} cal
                      </span>
                    )}
                    {item.allergens && item.allergens.length > 0 && (
                      <span style={{ color: `${theme.text}66` }}>
                        ⚠️ {item.allergens.join(", ")}
                      </span>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h3
                    className="text-sm font-bold uppercase tracking-wide"
                    style={{ color: theme.text }}
                  >
                    {item.name}
                  </h3>
                  <span
                    className="shrink-0 text-base font-extrabold"
                    style={{ color: theme.primary }}
                  >
                    {item.currency}{item.price}
                  </span>
                </div>

                {/* Spice level */}
                <div className="mb-4">
                  <SpiceLevel level={item.spiceLevel} accent={theme.accent} />
                </div>

                {/* Add / Quantity controls */}
                {qty === 0 ? (
                  <motion.button
                    onClick={() => onAddToCart(item)}
                    className="w-full rounded-full py-2.5 text-xs font-bold uppercase tracking-[0.15em] transition-colors duration-200"
                    style={{
                      backgroundColor: theme.primary,
                      color: theme.background,
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Add to Order
                  </motion.button>
                ) : (
                  <div
                    className="flex items-center justify-between rounded-full px-2 py-1"
                    style={{
                      border: `1.5px solid ${theme.primary}`,
                    }}
                  >
                    <motion.button
                      onClick={() => onRemoveFromCart(item.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold"
                      style={{ color: theme.primary }}
                      whileTap={{ scale: 0.85 }}
                    >
                      −
                    </motion.button>
                    <span
                      className="text-sm font-extrabold"
                      style={{ color: theme.text }}
                    >
                      {qty}
                    </span>
                    <motion.button
                      onClick={() => onAddToCart(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold"
                      style={{
                        backgroundColor: theme.primary,
                        color: theme.background,
                      }}
                      whileTap={{ scale: 0.85 }}
                    >
                      +
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
