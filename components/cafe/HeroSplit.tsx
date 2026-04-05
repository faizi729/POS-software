"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { CafeSectionProps } from "@/types/cafe-template";

/* ══════════════════════════════════════════════════════════════════════════════
   HeroSplit — Split-screen minimal hero (Image | Content)
   ════════════════════════════════════════════════════════════════════════════ */
export default function HeroSplit({
  restaurantData,
  theme,
}: CafeSectionProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(contentRef, { once: true });

  return (
    <section
      className="relative min-h-dvh w-full"
      style={{ backgroundColor: theme.background }}
    >
      <div className="grid min-h-dvh md:grid-cols-2">
        {/* ── Left — Hero image ────────────────────────────────────────── */}
        <div className="relative aspect-[4/3] md:aspect-auto">
          <img
            src={restaurantData.heroImage}
            alt={restaurantData.name}
            className="h-full w-full object-cover"
          />
          {/* Grain overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* ── Right — Content ──────────────────────────────────────────── */}
        <div
          ref={contentRef}
          className="flex flex-col justify-center px-8 py-16 md:px-16 lg:px-20"
        >
          {/* Today's brew badge */}
          <motion.div
            className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2"
            style={{
              borderColor: `${theme.text}12`,
              color: `${theme.text}88`,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="text-sm">☕</span>
            <span className="text-[11px] font-medium tracking-[0.15em] uppercase">
              Today&apos;s Brew: {restaurantData.todayBrew}
            </span>
          </motion.div>

          {/* Cafe name */}
          <motion.h1
            className="mb-4 text-3xl font-light leading-tight tracking-wide md:text-4xl lg:text-5xl"
            style={{ color: theme.text }}
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {restaurantData.name}
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="mb-10 text-sm font-light tracking-[0.1em] md:text-base"
            style={{ color: `${theme.text}88` }}
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            {restaurantData.tagline}
          </motion.p>

          {/* CTA — outlined minimal */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <a
              href="#the-space"
              className="inline-block rounded-full border px-8 py-3 text-xs font-medium tracking-[0.2em] uppercase transition-colors duration-300 hover:bg-[var(--cafe-text)] hover:text-[var(--cafe-bg)]"
              style={{
                borderColor: theme.text,
                color: theme.text,
              }}
            >
              Find a Seat
            </a>
          </motion.div>

          {/* Meta info */}
          <motion.div
            className="flex flex-wrap items-center gap-6"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.8 }}
          >
            {/* Workspace info */}
            <div className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={`${theme.text}66`}
                strokeWidth="1.5"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span
                className="text-[11px] tracking-wider"
                style={{ color: `${theme.text}66` }}
              >
                {restaurantData.workspaceInfo}
              </span>
            </div>

            {/* Separator */}
            <span
              className="text-[10px]"
              style={{ color: `${theme.text}25` }}
            >
              ·
            </span>

            {/* Followers */}
            <div className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={`${theme.text}66`}
                strokeWidth="1.5"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1.5" fill={`${theme.text}66`} stroke="none" />
              </svg>
              <span
                className="text-[11px] tracking-wider"
                style={{ color: `${theme.text}66` }}
              >
                {restaurantData.followers} followers
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
