"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { RegionalSectionProps } from "@/types/regional-template";

/* Deterministic particle sizes — avoids Math.random() hydration mismatch */
const PARTICLE_SIZES = [6, 8, 5, 9, 7, 4, 8, 6];

/* ══════════════════════════════════════════════════════════════════════════════
   HeroCultural — Full-bleed immersive cultural hero
   ════════════════════════════════════════════════════════════════════════════ */
export default function HeroCultural({
  restaurantData,
  theme,
  onReserve,
}: RegionalSectionProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background image with slow Ken Burns zoom */}
      <div className="absolute inset-0">
        <img
          src={restaurantData.heroImage}
          alt={restaurantData.name}
          className="h-full w-full object-cover animate-[kenburns_20s_ease-in-out_infinite_alternate]"
        />
      </div>

      {/* Floating spice / smoke particles — only rendered after mount to avoid SSR mismatch */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {PARTICLE_SIZES.map((size, i) => (
            <span
              key={i}
              className="absolute block rounded-full opacity-20"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${10 + i * 11}%`,
                bottom: "-10%",
                backgroundColor: theme.highlight,
                animation: `floatUp ${6 + i * 1.5}s ease-in infinite`,
                animationDelay: `${i * 0.8}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

      {/* Award badges — top right */}
      {restaurantData.awards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute right-4 top-6 z-20 flex flex-col gap-2 md:right-8 md:top-8"
        >
          {restaurantData.awards.map((award) => (
            <div
              key={award.id}
              className="flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium backdrop-blur-sm"
              style={{
                borderColor: `${theme.highlight}66`,
                backgroundColor: `${theme.accent}88`,
                color: theme.highlight,
              }}
            >
              {award.icon && <span>{award.icon}</span>}
              <span>{award.label}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-end px-6 pb-20 text-center md:pb-28">
        {/* Native script */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-3 text-lg italic tracking-widest md:text-xl"
          style={{ color: `${theme.highlight}cc` }}
        >
          {restaurantData.nativeText}
        </motion.p>

        {/* Restaurant name */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-3 font-serif text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl"
        >
          {restaurantData.name}
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="mb-8 max-w-xl text-base italic tracking-wide text-white/70 md:text-lg"
        >
          {restaurantData.tagline}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
        >
          {/* Primary CTA */}
          <button
            onClick={() => onReserve?.()}
            className="group relative overflow-hidden rounded-full px-8 py-3.5 text-sm font-semibold uppercase tracking-widest transition-all duration-300 hover:scale-105"
            style={{
              backgroundColor: theme.primary,
              color: "#fff",
            }}
          >
            <span className="relative z-10">Reserve Tonight</span>
            {/* Shimmer */}
            <span
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
            />
          </button>

          {/* Secondary CTA */}
          <button
            onClick={() => setShowVideo(true)}
            className="rounded-full border px-8 py-3.5 text-sm font-medium uppercase tracking-widest text-white/80 transition-all duration-300 hover:bg-white/10"
            style={{ borderColor: `${theme.highlight}66` }}
          >
            ▶ Watch Our Story
          </button>
        </motion.div>
      </div>

      {/* Video modal */}
      {showVideo && restaurantData.chef.videoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setShowVideo(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowVideo(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
            >
              ✕
            </button>
            <video
              src={restaurantData.chef.videoUrl}
              poster={restaurantData.chef.videoPoster}
              controls
              autoPlay
              className="w-full"
            />
          </motion.div>
        </div>
      )}

    </section>
  );
}
