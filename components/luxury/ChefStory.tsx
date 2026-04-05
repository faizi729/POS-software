"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { LuxurySectionProps } from "@/types/luxury-template";

/* ══════════════════════════════════════════════════════════════════════════════
   ChefStory — Split layout: image + handwritten-style quote
   ════════════════════════════════════════════════════════════════════════════ */
export default function ChefStory({
  restaurantData,
  theme,
}: LuxurySectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const { chef } = restaurantData;
  if (!chef) return null;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-20 md:py-28"
      style={{ backgroundColor: theme.background }}
    >
      {/* Decorative accent line */}
      <div
        className="absolute left-0 top-0 h-px w-full opacity-20"
        style={{ backgroundColor: theme.primary }}
      />

      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-24">
          {/* ── Chef image ──────────────────────────────────────────── */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-sm">
              <img
                src={chef.image}
                alt={chef.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {/* Subtle overlay gradient */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}44, transparent)`,
                }}
              />
            </div>

            {/* Floating name card */}
            <motion.div
              className="absolute -bottom-6 -right-4 rounded-sm px-6 py-4 shadow-xl md:-right-8"
              style={{ backgroundColor: theme.background }}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            >
              <p
                className="font-serif text-lg font-bold tracking-wide"
                style={{ color: theme.text }}
              >
                {chef.name}
              </p>
              <p
                className="text-xs uppercase tracking-[0.2em]"
                style={{ color: theme.primary }}
              >
                {chef.title}
              </p>
            </motion.div>
          </motion.div>

          {/* ── Quote / Story ───────────────────────────────────────── */}
          <motion.div
            className="flex flex-col"
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
          >
            <p
              className="mb-6 text-xs font-semibold uppercase tracking-[0.3em]"
              style={{ color: theme.primary }}
            >
              The Chef&apos;s Philosophy
            </p>

            {/* Large opening quote mark */}
            <span
              className="mb-2 font-serif text-6xl leading-none opacity-30 md:text-8xl"
              style={{ color: theme.primary }}
            >
              &ldquo;
            </span>

            {/* Quote text — italic serif feel */}
            <blockquote
              className="-mt-8 mb-8 font-serif text-xl italic leading-relaxed tracking-wide md:text-2xl lg:text-3xl"
              style={{ color: theme.text }}
            >
              {chef.quote}
            </blockquote>

            {/* Bio text (optional) */}
            {chef.bio && (
              <p
                className="max-w-md text-sm leading-relaxed"
                style={{ color: `${theme.text}99` }}
              >
                {chef.bio}
              </p>
            )}

            {/* Signature line */}
            <div className="mt-8 flex items-center gap-4">
              <div
                className="h-px w-12"
                style={{ backgroundColor: theme.primary }}
              />
              <span
                className="font-serif text-sm tracking-wider"
                style={{ color: `${theme.text}88` }}
              >
                — {chef.name}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
