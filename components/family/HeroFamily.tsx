"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { FamilySectionProps } from "@/types/family-template";

/* ══════════════════════════════════════════════════════════════════════════════
   HeroFamily — Warm, inviting full-width hero with Ken Burns effect
   ════════════════════════════════════════════════════════════════════════════ */
export default function HeroFamily({
  restaurantData,
  theme,
}: FamilySectionProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(contentRef, { once: true });

  return (
    <section className="relative flex min-h-[90vh] w-full items-center justify-center overflow-hidden md:min-h-dvh">
      {/* ── Background image with Ken Burns (slow CSS zoom) ────────────── */}
      <div className="absolute inset-0 z-0 animate-[kenburns_20s_ease-in-out_infinite_alternate]">
        <img
          src={restaurantData.heroImage}
          alt={restaurantData.name}
          className="h-full w-full object-cover"
        />
      </div>

      {/* ── Warm gradient overlay ──────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: `linear-gradient(180deg, ${theme.background}dd 0%, ${theme.background}88 40%, ${theme.background}cc 100%)`,
        }}
      />

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div
        ref={contentRef}
        className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center"
      >
        {/* Restaurant name */}
        <motion.h1
          className="mb-4 font-serif text-4xl font-bold leading-tight tracking-wide md:text-5xl lg:text-6xl"
          style={{ color: theme.text }}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          {restaurantData.name}
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="mb-8 max-w-lg font-serif text-lg italic leading-relaxed md:text-xl"
          style={{ color: `${theme.text}bb` }}
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
        >
          {restaurantData.tagline}
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="mb-6 flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
        >
          {/* Primary CTA */}
          <a
            href="#catering"
            className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold tracking-wider shadow-lg transition-transform duration-200 hover:scale-105"
            style={{
              backgroundColor: theme.primary,
              color: theme.background,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Book a Family Table
          </a>

          {/* Secondary CTA */}
          <a
            href="#today-special"
            className="inline-flex items-center gap-2 rounded-full border px-8 py-3.5 text-sm font-semibold tracking-wider transition-transform duration-200 hover:scale-105"
            style={{
              borderColor: theme.primary,
              color: theme.primary,
            }}
          >
            View Today&apos;s Specials
          </a>
        </motion.div>

        {/* Trust line */}
        <motion.p
          className="text-xs tracking-widest"
          style={{ color: `${theme.text}88` }}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 1.1, ease: "easeOut" }}
        >
          {restaurantData.trustText}
        </motion.p>
      </div>

      {/* ── Ken Burns keyframe (injected once) ─────────────────────────── */}
      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.08) translate(-1%, -1%); }
        }
      `}</style>
    </section>
  );
}
