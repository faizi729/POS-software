"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import type { RegionalSectionProps } from "@/types/regional-template";

/* ══════════════════════════════════════════════════════════════════════════════
   ChefSpeaks — Video story + pull quote + credentials
   ════════════════════════════════════════════════════════════════════════════ */
export default function ChefSpeaks({
  restaurantData,
  theme,
}: RegionalSectionProps) {
  const chef = restaurantData.chef;
  if (!chef) return null;

  const [playing, setPlaying] = useState(false);

  return (
    <section
      className="relative overflow-hidden py-20 md:py-32"
      style={{ backgroundColor: theme.accent, color: `${theme.background}ee` }}
    >
      {/* Decorative pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(${theme.highlight} 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 md:px-12">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="mb-14 text-center md:mb-20"
        >
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-[0.3em]"
            style={{ color: theme.highlight }}
          >
            Meet the Chef
          </p>
          <h2
            className="font-serif text-3xl font-bold md:text-5xl"
            style={{ color: theme.background }}
          >
            The Soul Behind the Cuisine
          </h2>
        </motion.div>

        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
          {/* Video / Poster */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative w-full max-w-xl flex-shrink-0 overflow-hidden rounded-2xl"
          >
            {playing ? (
              <video
                src={chef.videoUrl}
                poster={chef.videoPoster}
                controls
                autoPlay
                className="w-full rounded-2xl"
              />
            ) : (
              <div
                className="group relative cursor-pointer"
                onClick={() => setPlaying(true)}
              >
                <img
                  src={chef.image}
                  alt={chef.name}
                  className="w-full rounded-2xl object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ minHeight: "320px", maxHeight: "480px" }}
                  loading="lazy"
                />
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30 transition-colors duration-300 group-hover:bg-black/40">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full text-2xl transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${theme.primary}ee` }}
                  >
                    ▶
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Quote + credentials */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1"
          >
            {/* Pull quote */}
            <blockquote className="mb-6">
              <span
                className="text-5xl font-serif leading-none"
                style={{ color: `${theme.highlight}88` }}
              >
                &ldquo;
              </span>
              <p
                className="mt-2 font-serif text-xl italic leading-relaxed md:text-2xl"
                style={{ color: `${theme.background}dd` }}
              >
                {chef.quote}
              </p>
            </blockquote>

            {/* Name + title */}
            <div className="mb-6">
              <p
                className="text-lg font-bold"
                style={{ color: theme.highlight }}
              >
                {chef.name}
              </p>
              <p
                className="text-sm"
                style={{ color: `${theme.background}88` }}
              >
                {chef.title}
              </p>
            </div>

            {/* Credentials */}
            {chef.credentials.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {chef.credentials.map((cred, idx) => (
                  <span
                    key={idx}
                    className="rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-wider"
                    style={{
                      borderColor: `${theme.highlight}33`,
                      color: `${theme.background}aa`,
                    }}
                  >
                    {cred}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
