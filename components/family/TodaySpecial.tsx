"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { FamilySectionProps } from "@/types/family-template";

/* ══════════════════════════════════════════════════════════════════════════════
   TodaySpecial — Highlighted dish card with emotional story
   ════════════════════════════════════════════════════════════════════════════ */
export default function TodaySpecial({
  restaurantData,
  theme,
}: FamilySectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  const special = restaurantData.todaySpecial;
  if (!special) return null;

  return (
    <section
      id="today-special"
      ref={sectionRef}
      className="relative py-16 md:py-24"
      style={{ backgroundColor: theme.background }}
    >
      {/* Section label */}
      <motion.div
        className="mb-10 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <p
          className="mb-2 text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: theme.accent }}
        >
          Made with Love
        </p>
        <h2
          className="font-serif text-3xl font-bold tracking-wide md:text-4xl"
          style={{ color: theme.text }}
        >
          Today&apos;s Special
        </h2>
      </motion.div>

      {/* Card */}
      <motion.div
        className="mx-auto max-w-3xl px-6 md:px-12"
        initial={{ opacity: 0, y: 25 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      >
        <div
          className="overflow-hidden rounded-3xl shadow-lg md:flex"
          style={{
            backgroundColor: theme.background,
            border: `1px solid ${theme.text}10`,
            boxShadow: `0 12px 40px ${theme.text}08`,
          }}
        >
          {/* Dish image */}
          <div className="relative aspect-[4/3] md:aspect-auto md:w-1/2">
            <img
              src={special.image}
              alt={special.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {/* Warm overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}44, transparent)`,
              }}
            />
          </div>

          {/* Content */}
          <div className="flex flex-col justify-center p-8 md:w-1/2 md:p-10">
            {/* Dish name */}
            <h3
              className="mb-3 font-serif text-2xl font-bold tracking-wide md:text-3xl"
              style={{ color: theme.text }}
            >
              {special.name}
            </h3>

            {/* Decorative divider */}
            <div
              className="mb-4 h-0.5 w-12 rounded-full"
              style={{ backgroundColor: theme.primary }}
            />

            {/* Story */}
            <p
              className="mb-6 font-serif text-sm italic leading-relaxed md:text-base"
              style={{ color: `${theme.text}aa` }}
            >
              &ldquo;{special.story}&rdquo;
            </p>

            {/* Price */}
            <p
              className="mb-6 font-serif text-2xl font-bold"
              style={{ color: theme.primary }}
            >
              {special.currency}{special.price}
            </p>

            {/* CTA */}
            <a
              href="#menu"
              className="inline-flex w-fit items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold tracking-wider shadow transition-transform duration-200 hover:scale-105"
              style={{
                backgroundColor: theme.primary,
                color: theme.background,
              }}
            >
              Order Now
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
