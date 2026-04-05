"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { LuxurySectionProps } from "@/types/luxury-template";

/* ══════════════════════════════════════════════════════════════════════════════
   SignatureCarousel — Horizontal scroll showcase of featured dishes
   ════════════════════════════════════════════════════════════════════════════ */
export default function SignatureCarousel({
  menuData,
  theme,
}: LuxurySectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const items = menuData.featuredItems;
  if (!items || items.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="relative py-20 md:py-28"
      style={{ backgroundColor: theme.background }}
    >
      {/* Section heading */}
      <motion.div
        className="mb-12 px-6 text-center md:px-12"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <p
          className="mb-3 text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: theme.primary }}
        >
          Curated for You
        </p>
        <h2
          className="font-serif text-3xl font-bold tracking-wide md:text-4xl lg:text-5xl"
          style={{ color: theme.text }}
        >
          Signature Dishes
        </h2>
      </motion.div>

      {/* Horizontal scroll container */}
      <div className="no-scrollbar flex gap-6 overflow-x-auto px-6 pb-4 md:gap-8 md:px-12">
        {items.map((item, idx) => (
          <motion.div
            key={item.id}
            className="group relative flex-shrink-0 cursor-pointer overflow-hidden rounded-lg"
            style={{ width: "300px", height: "400px" }}
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{
              duration: 0.6,
              delay: idx * 0.12,
              ease: "easeOut",
            }}
          >
            {/* Dish image — blurred by default, unblurs on hover */}
            <div className="absolute inset-0 blur-[3px] transition-[filter] duration-500 ease-out group-hover:blur-0">

              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                loading="lazy"
              />
            </div>

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Tag */}
            {item.tag && (
              <span
                className="absolute left-4 top-4 rounded-sm px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{
                  backgroundColor: theme.primary,
                  color: theme.background,
                }}
              >
                {item.tag}
              </span>
            )}

            {/* Text content */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h3
                className="mb-1 font-serif text-lg font-semibold tracking-wide"
                style={{ color: theme.text }}
              >
                {item.name}
              </h3>
              <p
                className="mb-3 text-xs leading-relaxed opacity-80"
                style={{ color: theme.text }}
              >
                {item.description}
              </p>

              {/* Price — revealed on hover */}
              <div
                className="translate-y-4 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100"
              >
                <span
                  className="font-serif text-xl font-bold"
                  style={{ color: theme.primary }}
                >
                  {item.currency}
                  {item.price}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

    </section>
  );
}
