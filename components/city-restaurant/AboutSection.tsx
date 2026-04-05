"use client";

import React from "react";
import { motion } from "framer-motion";
import type { CityRestaurantSectionProps } from "@/types/city-restaurant-template";

/* ══════════════════════════════════════════════════════════════════════════════
   AboutSection — 2-column split layout with feature points
   ════════════════════════════════════════════════════════════════════════════ */
export default function AboutSection({
  restaurantData,
  theme,
}: CityRestaurantSectionProps) {
  return (
    <section id="about" className="relative py-20 md:py-28">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 md:flex-row md:gap-16 md:px-12">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative w-full md:w-1/2"
        >
          <div className="relative overflow-hidden rounded-2xl">
            <img
              src={restaurantData.aboutImage}
              alt={`About ${restaurantData.name}`}
              className="w-full object-cover"
              style={{ minHeight: "360px", maxHeight: "520px" }}
              loading="lazy"
            />
          </div>
          {/* Decorative accent */}
          <div
            className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-2xl"
            style={{ backgroundColor: `${theme.primary}15` }}
          />
          {/* Established badge */}
          <div
            className="absolute -bottom-4 left-6 rounded-xl px-5 py-3 text-center shadow-lg"
            style={{ backgroundColor: theme.background, border: `1px solid ${theme.text}12` }}
          >
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: `${theme.text}66` }}>
              Est.
            </p>
            <p className="font-serif text-xl font-bold" style={{ color: theme.accent }}>
              {restaurantData.established}
            </p>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full md:w-1/2"
        >
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-[0.3em]"
            style={{ color: theme.accent }}
          >
            Our Story
          </p>
          <h2
            className="mb-6 font-serif text-3xl font-bold md:text-4xl"
            style={{ color: theme.text }}
          >
            A Legacy of Flavour
          </h2>
          <p
            className="mb-8 text-base leading-relaxed"
            style={{ color: `${theme.text}88` }}
          >
            {restaurantData.description}
          </p>

          {/* Features */}
          <div className="grid gap-4 sm:grid-cols-2">
            {restaurantData.features.map((feat, idx) => (
              <motion.div
                key={feat}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + idx * 0.08 }}
                className="flex items-center gap-3"
              >
                <span
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs"
                  style={{ backgroundColor: `${theme.primary}18`, color: theme.primary }}
                >
                  ✓
                </span>
                <span className="text-sm font-medium" style={{ color: `${theme.text}cc` }}>
                  {feat}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
