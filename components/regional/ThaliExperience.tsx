"use client";

import React from "react";
import { motion } from "framer-motion";
import type { RegionalSectionProps } from "@/types/regional-template";

/* ══════════════════════════════════════════════════════════════════════════════
   ThaliExperience — Set menu / Thali visual breakdown
   ════════════════════════════════════════════════════════════════════════════ */
export default function ThaliExperience({
  restaurantData,
  theme,
  onReserve,
}: RegionalSectionProps) {
  const setMenu = restaurantData.setMenu;
  if (!setMenu) return null;

  return (
    <section
      className="relative overflow-hidden py-20 md:py-32"
      style={{ backgroundColor: `${theme.accent}0d`, color: theme.text }}
    >
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
          The Complete Experience
        </p>
        <h2 className="font-serif text-3xl font-bold md:text-5xl">
          {setMenu.title}
        </h2>
        <p
          className="mx-auto mt-4 max-w-xl text-base leading-relaxed"
          style={{ color: `${theme.text}99` }}
        >
          {setMenu.description}
        </p>
      </motion.div>

      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-16">
          {/* Main thali image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative w-full max-w-md flex-shrink-0"
          >
            <div className="relative overflow-hidden rounded-full border-4" style={{ borderColor: `${theme.highlight}44` }}>
              <img
                src={setMenu.image}
                alt={setMenu.title}
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
              {/* Price overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: `${theme.accent}55` }}
              >
                <div className="text-center">
                  <p className="text-sm font-medium uppercase tracking-widest text-white/70">
                    Starting at
                  </p>
                  <p
                    className="text-4xl font-bold md:text-5xl"
                    style={{ color: theme.highlight }}
                  >
                    {setMenu.currency}{setMenu.price}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Items grid */}
          <div className="flex-1">
            <div className="grid gap-4 sm:grid-cols-2">
              {setMenu.items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="flex items-start gap-4 rounded-xl border p-4 transition-colors duration-300"
                  style={{
                    borderColor: `${theme.text}10`,
                    backgroundColor: theme.background,
                  }}
                >
                  {/* Number badge */}
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: `${theme.primary}18`,
                      color: theme.primary,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <h4
                      className="font-serif text-sm font-bold"
                      style={{ color: theme.text }}
                    >
                      {item.name}
                    </h4>
                    <p
                      className="mt-1 text-xs leading-relaxed"
                      style={{ color: `${theme.text}77` }}
                    >
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <button
                onClick={() => onReserve?.({ experience: setMenu.title })}
                className="group relative overflow-hidden rounded-full px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: theme.primary }}
              >
                <span className="relative z-10">Book This Experience</span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
