"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { RegionalSectionProps } from "@/types/regional-template";

/* ══════════════════════════════════════════════════════════════════════════════
   HeritageStory — Magazine-style story scroll with parallax
   ════════════════════════════════════════════════════════════════════════════ */
export default function HeritageStory({
  restaurantData,
  theme,
}: RegionalSectionProps) {
  const heritage = restaurantData.heritage;
  if (!heritage || heritage.length === 0) return null;

  return (
    <section className="relative py-20 md:py-32" style={{ color: theme.text }}>
      {/* Section heading */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8 }}
        className="mb-16 px-6 text-center md:mb-24 md:px-12"
      >
        <p
          className="mb-3 text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: theme.primary }}
        >
          Our Heritage
        </p>
        <h2 className="font-serif text-3xl font-bold md:text-5xl">
          Recipes Passed Down. Never Written.
        </h2>
      </motion.div>

      {/* Story blocks — alternating layout */}
      <div className="mx-auto max-w-6xl space-y-24 px-6 md:space-y-32 md:px-12">
        {heritage.map((block, idx) => (
          <HeritageBlock
            key={block.id}
            block={block}
            index={idx}
            theme={theme}
          />
        ))}
      </div>
    </section>
  );
}

/* ── Single Heritage Block ─────────────────────────────────────────────────── */
function HeritageBlock({
  block,
  index,
  theme,
}: {
  block: RegionalSectionProps["restaurantData"]["heritage"][number];
  index: number;
  theme: RegionalSectionProps["theme"];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);
  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8 }}
      className={`flex flex-col gap-8 md:flex-row md:items-center md:gap-16 ${
        !isEven ? "md:flex-row-reverse" : ""
      }`}
    >
      {/* Image with parallax */}
      <div className="relative flex-1 overflow-hidden rounded-2xl">
        {/* Year badge */}
        {block.year && (
          <div
            className="absolute left-4 top-4 z-10 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
            style={{
              backgroundColor: `${theme.accent}ee`,
              color: theme.highlight,
            }}
          >
            {block.year}
          </div>
        )}
        <motion.div style={{ y: imageY }} className="relative">
          <img
            src={block.image}
            alt={block.imageAlt}
            className="w-full rounded-2xl object-cover"
            style={{ minHeight: "320px", maxHeight: "480px" }}
            loading="lazy"
          />
        </motion.div>
      </div>

      {/* Text */}
      <div className="flex-1">
        <h3
          className="mb-4 font-serif text-2xl font-bold md:text-3xl"
          style={{ color: theme.accent }}
        >
          {block.heading}
        </h3>
        <p
          className="text-base leading-relaxed md:text-lg"
          style={{ color: `${theme.text}bb` }}
        >
          {block.body}
        </p>
        {/* Decorative line */}
        <div
          className="mt-6 h-0.5 w-16 rounded-full"
          style={{ backgroundColor: `${theme.primary}66` }}
        />
      </div>
    </motion.div>
  );
}
