"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  CityRestaurantSectionProps,
  MenuCategory,
} from "@/types/city-restaurant-template";

const CATEGORIES: { key: MenuCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "starters", label: "Starters" },
  { key: "mains", label: "Mains" },
  { key: "desserts", label: "Desserts" },
  { key: "drinks", label: "Drinks" },
];

/* ══════════════════════════════════════════════════════════════════════════════
   MenuSection — Category filters + responsive grid
   ════════════════════════════════════════════════════════════════════════════ */
export default function MenuSection({
  menuData,
  theme,
}: CityRestaurantSectionProps) {
  const [active, setActive] = useState<MenuCategory | "all">("all");

  const filtered =
    active === "all"
      ? menuData.items
      : menuData.items.filter((item) => item.category === active);

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
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActive(cat.key)}
            className="rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300"
            style={{
              backgroundColor:
                active === cat.key ? theme.primary : `${theme.text}0a`,
              color: active === cat.key ? "#fff" : `${theme.text}99`,
            }}
          >
            {cat.label}
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
    </section>
  );
}
