"use client";

import React from "react";
import { motion } from "framer-motion";
import type { StreetSectionProps, OrderMode } from "@/types/street-template";

/* ══════════════════════════════════════════════════════════════════════════════
   HeroStreet — Full-viewport bold streetwear hero
   ════════════════════════════════════════════════════════════════════════════ */
const ORDER_MODES: { value: OrderMode; label: string }[] = [
  { value: "dine-in", label: "Dine In" },
  { value: "takeaway", label: "Takeaway" },
  { value: "delivery", label: "Delivery" },
];

export default function HeroStreet({
  restaurantData,
  theme,
  orderMode,
  onOrderModeChange,
}: StreetSectionProps) {
  return (
    <section className="relative flex h-dvh w-full items-center justify-center overflow-hidden">
      {/* ── Background image with zoom ─────────────────────────────────── */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: "easeOut" }}
      >
        <img
          src={restaurantData.heroImage}
          alt={restaurantData.name}
          className="h-full w-full object-cover"
        />
      </motion.div>

      {/* ── Dark overlay with neon tint ─────────────────────────────────── */}
      <div className="absolute inset-0 z-[1] bg-black/70" />
      <div
        className="absolute inset-0 z-[1] opacity-10"
        style={{
          background: `radial-gradient(ellipse at bottom center, ${theme.primary}, transparent 60%)`,
        }}
      />

      {/* ── Top badges row ─────────────────────────────────────────────── */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between p-5 md:p-8">
        {/* Brand name */}
        <motion.span
          className="text-sm font-extrabold uppercase tracking-[0.25em]"
          style={{ color: theme.primary }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {restaurantData.name}
        </motion.span>

        {/* Live wait time */}
        <motion.div
          className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
          style={{
            backgroundColor: `${theme.accent}22`,
            color: theme.accent,
            border: `1px solid ${theme.accent}44`,
          }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Pulsing dot */}
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: theme.accent }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: theme.accent }}
            />
          </span>
          {restaurantData.waitTime}
        </motion.div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Loyalty badge */}
        {restaurantData.loyaltyText && (
          <motion.div
            className="mb-6 rounded-full px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{
              backgroundColor: `${theme.primary}18`,
              color: theme.primary,
              border: `1px solid ${theme.primary}33`,
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {restaurantData.loyaltyText}
          </motion.div>
        )}

        {/* Tagline — BIG CAPS */}
        <motion.h1
          className="mb-3 max-w-4xl text-4xl font-black uppercase leading-none tracking-tight md:text-6xl lg:text-8xl"
          style={{ color: theme.text }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
        >
          {restaurantData.tagline}
        </motion.h1>

        {/* Subheading */}
        {restaurantData.subheading && (
          <motion.p
            className="mb-8 max-w-lg text-sm tracking-wider md:text-base"
            style={{ color: `${theme.text}99` }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7 }}
          >
            {restaurantData.subheading}
          </motion.p>
        )}

        {/* ── Order mode toggle ────────────────────────────────────────── */}
        <motion.div
          className="mb-8 flex overflow-hidden rounded-full"
          style={{
            backgroundColor: `${theme.text}10`,
            border: `1px solid ${theme.text}20`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          {ORDER_MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => onOrderModeChange(m.value)}
              className="relative px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] transition-colors duration-200"
              style={{
                color:
                  orderMode === m.value ? theme.background : `${theme.text}88`,
                backgroundColor:
                  orderMode === m.value ? theme.primary : "transparent",
              }}
            >
              {m.label}
            </button>
          ))}
        </motion.div>

        {/* ── CTA button ───────────────────────────────────────────────── */}
        <motion.a
          href="#menu"
          className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-10 py-4 text-sm font-extrabold uppercase tracking-[0.2em] transition-transform duration-300 hover:scale-105"
          style={{
            backgroundColor: theme.primary,
            color: theme.background,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          {/* Shimmer */}
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full" />
          <span className="relative z-10">Order Now</span>
          <svg
            className="relative z-10"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </motion.a>
      </div>

      {/* ── Scroll indicator ───────────────────────────────────────────── */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5, y: [0, 8, 0] }}
        transition={{
          opacity: { delay: 2, duration: 1 },
          y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.primary}
          strokeWidth="2"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </motion.div>
    </section>
  );
}
