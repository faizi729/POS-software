"use client";

import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import type { CafeSectionProps } from "@/types/cafe-template";

/* ══════════════════════════════════════════════════════════════════════════════
   SeasonalMenu — Minimal responsive grid with hover ingredient stories
   ════════════════════════════════════════════════════════════════════════════ */
export default function SeasonalMenu({
  menuData,
  theme,
}: CafeSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const items = menuData.items;
  if (!items || items.length === 0) return null;

  return (
    <section
      id="menu"
      ref={sectionRef}
      className="py-[var(--space-xl)] md:py-[var(--space-2xl)]"
      style={{ backgroundColor: theme.background }}
    >
      {/* Heading */}
      <motion.div
        className="mb-[var(--space-lg)] px-6 text-center md:px-12"
        initial={{ opacity: 0, y: 15 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <p
          className="mb-2 text-[11px] font-medium uppercase tracking-[0.3em]"
          style={{ color: theme.accent }}
        >
          Seasonal Selection
        </p>
        <h2
          className="text-2xl font-light tracking-wide md:text-3xl"
          style={{ color: theme.text }}
        >
          The Menu
        </h2>
      </motion.div>

      {/* Grid */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-px border sm:grid-cols-2 lg:grid-cols-3"
        style={{ borderColor: `${theme.text}10` }}
      >
        {items.map((item, idx) => {
          const isHovered = hoveredId === item.id;

          return (
            <motion.div
              key={item.id}
              className="group relative cursor-default"
              style={{ borderColor: `${theme.text}10` }}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: idx * 0.06 }}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />

                {/* Ingredient story overlay — revealed on hover */}
                {item.ingredientStory && (
                  <motion.div
                    className="absolute inset-0 flex items-end p-5"
                    style={{ backgroundColor: `${theme.background}ee` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: `${theme.text}aa` }}
                    >
                      {item.ingredientStory}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Info */}
              <div
                className="flex items-start justify-between border-t p-5"
                style={{ borderColor: `${theme.text}08` }}
              >
                <div>
                  <h3
                    className="mb-1.5 text-sm font-medium tracking-wide"
                    style={{ color: theme.text }}
                  >
                    {item.name}
                  </h3>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border px-2.5 py-0.5 text-[10px] tracking-wider"
                        style={{
                          borderColor: `${theme.text}12`,
                          color: `${theme.text}66`,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <span
                  className="shrink-0 text-sm font-medium tracking-wider"
                  style={{ color: theme.primary }}
                >
                  {item.currency}{item.price}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
