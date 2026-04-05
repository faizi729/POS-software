"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { FamilySectionProps } from "@/types/family-template";

/* ══════════════════════════════════════════════════════════════════════════════
   StoryTimeline — Vertical timeline with warm handwritten annotations
   ════════════════════════════════════════════════════════════════════════════ */
export default function StoryTimeline({
  restaurantData,
  theme,
}: FamilySectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  const timeline = restaurantData.storyTimeline;
  if (!timeline || timeline.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="relative py-16 md:py-24"
      style={{ backgroundColor: theme.background }}
    >
      {/* Heading */}
      <motion.div
        className="mb-14 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <p
          className="mb-2 text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: theme.accent }}
        >
          Our Roots
        </p>
        <h2
          className="font-serif text-3xl font-bold tracking-wide md:text-4xl"
          style={{ color: theme.text }}
        >
          Our Story
        </h2>
      </motion.div>

      {/* Timeline */}
      <div className="relative mx-auto max-w-3xl px-6 md:px-12">
        {/* Vertical line */}
        <div
          className="absolute bottom-0 left-10 top-0 hidden w-px md:left-1/2 md:block"
          style={{ backgroundColor: `${theme.primary}30` }}
        />

        {timeline.map((item, idx) => {
          const isLeft = idx % 2 === 0;

          return (
            <motion.div
              key={item.id}
              className={`relative mb-14 last:mb-0 md:flex md:items-start ${
                isLeft ? "md:flex-row" : "md:flex-row-reverse"
              }`}
              initial={{ opacity: 0, y: 25 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.7,
                delay: idx * 0.15,
                ease: "easeOut",
              }}
            >
              {/* Content side */}
              <div
                className={`md:w-1/2 ${isLeft ? "md:pr-12 md:text-right" : "md:pl-12 md:text-left"}`}
              >
                {/* Year badge */}
                <span
                  className="mb-3 inline-block rounded-full px-4 py-1 text-xs font-bold tracking-wider"
                  style={{
                    backgroundColor: `${theme.primary}15`,
                    color: theme.primary,
                  }}
                >
                  {item.year}
                </span>

                {/* Image */}
                <div className="mb-4 overflow-hidden rounded-2xl shadow-md">
                  <img
                    src={item.image}
                    alt={item.description}
                    className="aspect-[16/10] w-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Description */}
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: `${theme.text}aa` }}
                >
                  {item.description}
                </p>

                {/* Handwritten annotation */}
                {item.annotation && (
                  <p
                    className="mt-3 -rotate-2 font-serif text-sm italic"
                    style={{ color: theme.accent }}
                  >
                    — {item.annotation}
                  </p>
                )}
              </div>

              {/* Center dot (desktop) */}
              <div className="absolute left-10 top-2 hidden -translate-x-1/2 md:left-1/2 md:flex">
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: theme.primary,
                    boxShadow: `0 0 0 4px ${theme.background}, 0 0 0 5px ${theme.primary}30`,
                  }}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: theme.background }}
                  />
                </div>
              </div>

              {/* Empty space for the other half (desktop) */}
              <div className="hidden md:block md:w-1/2" />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
