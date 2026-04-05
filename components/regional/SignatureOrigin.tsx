"use client";

import React from "react";
import { motion } from "framer-motion";
import type { RegionalSectionProps } from "@/types/regional-template";

/* ══════════════════════════════════════════════════════════════════════════════
   SignatureOrigin — Signature dishes with origin cards
   ════════════════════════════════════════════════════════════════════════════ */
export default function SignatureOrigin({
  menuData,
  theme,
}: RegionalSectionProps) {
  const items = menuData.signatureItems;
  if (!items || items.length === 0) return null;

  return (
    <section className="relative py-20 md:py-32" style={{ color: theme.text }}>
      {/* Section heading */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8 }}
        className="mb-14 px-6 text-center md:mb-20 md:px-12"
      >
        <p
          className="mb-3 text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: theme.primary }}
        >
          Signature Dishes
        </p>
        <h2 className="font-serif text-3xl font-bold md:text-5xl">
          From Our Roots to Your Plate
        </h2>
      </motion.div>

      {/* Cards grid */}
      <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-2 lg:grid-cols-3 md:px-12">
        {items.map((dish, idx) => (
          <motion.div
            key={dish.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            className="group relative overflow-hidden rounded-2xl border transition-shadow duration-300 hover:shadow-xl"
            style={{
              borderColor: `${theme.text}12`,
              backgroundColor: theme.background,
            }}
          >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={dish.image}
                alt={dish.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              {/* Origin tag */}
              <div
                className="absolute bottom-3 left-3 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-sm"
                style={{
                  backgroundColor: `${theme.accent}dd`,
                  color: theme.highlight,
                }}
              >
                📍 {dish.origin}
              </div>
              {/* Chef recommended badge */}
              {dish.chefRecommended && (
                <div
                  className="absolute right-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${theme.highlight}ee`,
                    color: theme.accent,
                  }}
                >
                  ⭐ Chef&apos;s Pick
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              <h3
                className="mb-1 font-serif text-lg font-bold"
                style={{ color: theme.text }}
              >
                {dish.name}
              </h3>

              <p
                className="mb-3 text-sm italic leading-relaxed"
                style={{ color: `${theme.text}88` }}
              >
                {dish.story}
              </p>

              {/* Spice level */}
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: `${theme.text}66` }}
                >
                  Spice
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className="text-sm"
                      style={{
                        opacity: i < dish.spiceLevel ? 1 : 0.2,
                      }}
                    >
                      🌶️
                    </span>
                  ))}
                </div>
              </div>

              {/* Price */}
              {dish.price != null && (
                <p
                  className="mt-3 text-lg font-bold"
                  style={{ color: theme.primary }}
                >
                  {dish.currency ?? "$"}{dish.price}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
