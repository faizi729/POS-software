"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { StreetSectionProps } from "@/types/street-template";

/* ══════════════════════════════════════════════════════════════════════════════
   SocialWall — Instagram-style grid of food images
   ════════════════════════════════════════════════════════════════════════════ */
export default function SocialWall({
  restaurantData,
  theme,
}: StreetSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  const images = restaurantData.socialImages;
  if (!images || images.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="relative py-16 md:py-24"
      style={{ backgroundColor: theme.background }}
    >
      {/* Section heading */}
      <motion.div
        className="mb-10 px-6 text-center md:px-12"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <p
          className="mb-2 text-xs font-bold uppercase tracking-[0.3em]"
          style={{ color: theme.primary }}
        >
          @{restaurantData.name.toLowerCase().replace(/\s+/g, "")}
        </p>
        <h2
          className="text-3xl font-black uppercase tracking-tight md:text-5xl"
          style={{ color: theme.text }}
        >
          The Feed
        </h2>
      </motion.div>

      {/* Grid */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 px-4 sm:grid-cols-3 md:grid-cols-4 md:gap-3 md:px-8">
        {images.map((img, idx) => (
          <motion.a
            key={img.id}
            href={img.link ?? "#"}
            target={img.link ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden rounded-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4, delay: idx * 0.06, ease: "easeOut" }}
          >
            <img
              src={img.src}
              alt={img.alt}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />

            {/* Hover overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ backgroundColor: `${theme.background}88` }}
            >
              {/* Instagram icon */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.primary}
                strokeWidth="1.5"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1.5" fill={theme.primary} stroke="none" />
              </svg>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
