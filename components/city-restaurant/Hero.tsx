"use client";

import React from "react";
import { motion } from "framer-motion";
import type { CityRestaurantSectionProps } from "@/types/city-restaurant-template";

/* ══════════════════════════════════════════════════════════════════════════════
   Hero — Full-height hero with background image, overlay, CTAs
   ════════════════════════════════════════════════════════════════════════════ */
export default function Hero({
  restaurantData,
  theme,
  onReserve,
}: CityRestaurantSectionProps) {
  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="relative flex h-screen w-full items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={restaurantData.heroImage}
          alt={restaurantData.name}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Overlay gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${theme.background}99 0%, ${theme.background}dd 50%, ${theme.background}ff 100%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        {/* Accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto mb-6 h-0.5 w-16 origin-center"
          style={{ backgroundColor: theme.accent }}
        />

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-4 text-sm font-semibold uppercase tracking-[0.3em]"
          style={{ color: theme.accent }}
        >
          {restaurantData.tagline}
        </motion.p>

        {/* Restaurant name */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-6 font-serif text-5xl font-bold leading-tight md:text-7xl lg:text-8xl"
          style={{ color: theme.text }}
        >
          {restaurantData.name}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mx-auto mb-10 max-w-xl text-base leading-relaxed md:text-lg"
          style={{ color: `${theme.text}99` }}
        >
          {restaurantData.description}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-5"
        >
          <button
            onClick={() => onReserve ? onReserve({ name: "", phone: "", date: "", time: "", guests: 2, occasion: "" }) : scrollTo("#reservation")}
            className="group relative overflow-hidden rounded-full px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:scale-105"
            style={{ backgroundColor: theme.primary }}
          >
            <span className="relative z-10">Reserve a Table</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </button>

          <button
            onClick={() => scrollTo("#menu")}
            className="rounded-full border px-8 py-3.5 text-sm font-semibold uppercase tracking-widest transition-all duration-300 hover:bg-white/5"
            style={{ borderColor: `${theme.accent}66`, color: theme.text }}
          >
            View Menu
          </button>
        </motion.div>

        {/* Rating badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-10 inline-flex items-center gap-2 rounded-full border px-4 py-2"
          style={{ borderColor: `${theme.text}15`, backgroundColor: `${theme.text}08` }}
        >
          <span style={{ color: theme.accent }}>★</span>
          <span className="text-sm font-medium" style={{ color: theme.text }}>
            {restaurantData.rating}
          </span>
          <span className="text-xs" style={{ color: `${theme.text}66` }}>
            ({restaurantData.reviews} reviews)
          </span>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div
          className="h-10 w-6 rounded-full border-2"
          style={{ borderColor: `${theme.text}33` }}
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mx-auto mt-2 h-2 w-1 rounded-full"
            style={{ backgroundColor: theme.accent }}
          />
        </div>
      </motion.div>
    </section>
  );
}
