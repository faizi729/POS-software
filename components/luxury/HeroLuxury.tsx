"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { LuxurySectionProps } from "@/types/luxury-template";

/* ══════════════════════════════════════════════════════════════════════════════
   HeroLuxury — Full-viewport cinematic hero with video background
   ════════════════════════════════════════════════════════════════════════════ */
export default function HeroLuxury({
  restaurantData,
  theme,
}: LuxurySectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = 0.8; // Slow cinematic feel
      video.addEventListener("loadeddata", () => setIsLoaded(true));
    }
  }, []);

  return (
    <section className="relative flex h-dvh w-full items-center justify-center overflow-hidden">
      {/* ── Background video with zoom effect ──────────────────────────── */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 12, ease: "easeOut" }}
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src={restaurantData.heroVideo}
          poster={restaurantData.heroPoster}
          autoPlay
          muted
          loop
          playsInline
        />
      </motion.div>

      {/* ── Dark overlay ───────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-[1] bg-black/60" />

      {/* ── Award badge (top-right) ────────────────────────────────────── */}
      {restaurantData.award && (
        <motion.div
          className="absolute right-6 top-6 z-20 flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] backdrop-blur-sm md:right-10 md:top-10 md:text-sm"
          style={{
            borderColor: `${theme.primary}66`,
            color: theme.primary,
            backgroundColor: `${theme.background}99`,
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8, ease: "easeOut" }}
        >
          {restaurantData.award.icon && (
            <span className="text-base">{restaurantData.award.icon}</span>
          )}
          {restaurantData.award.label}
        </motion.div>
      )}

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Restaurant name */}
        <motion.h1
          className="mb-4 font-serif text-4xl font-bold leading-tight tracking-wide md:text-6xl lg:text-7xl"
          style={{ color: theme.text }}
          initial={{ opacity: 0, y: 30 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        >
          {restaurantData.name}
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="mb-8 max-w-xl text-base font-light tracking-wider md:text-lg lg:text-xl"
          style={{ color: `${theme.text}cc` }}
          initial={{ opacity: 0, y: 20 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
        >
          {restaurantData.tagline}
        </motion.p>

        {/* CTA Button with shimmer */}
        <motion.a
          href="#reservation"
          className="group relative mb-4 inline-flex items-center gap-2 overflow-hidden rounded-sm px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition-transform duration-300 hover:scale-105"
          style={{
            backgroundColor: theme.primary,
            color: theme.background,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 1.1, ease: "easeOut" }}
        >
          {/* Shimmer overlay */}
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full" />
          <span className="relative z-10">Reserve Your Table Tonight</span>
        </motion.a>

        {/* Availability text */}
        <motion.p
          className="text-xs tracking-widest uppercase md:text-sm"
          style={{ color: `${theme.text}88` }}
          initial={{ opacity: 0 }}
          animate={isLoaded ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 1.5 }}
        >
          {restaurantData.availability}
        </motion.p>
      </div>

      {/* ── Scroll indicator ───────────────────────────────────────────── */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6, y: [0, 8, 0] }}
        transition={{
          opacity: { delay: 2, duration: 1 },
          y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.text}
          strokeWidth="1.5"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </motion.div>
    </section>
  );
}
