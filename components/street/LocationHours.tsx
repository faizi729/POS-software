"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { StreetSectionProps } from "@/types/street-template";

/* ══════════════════════════════════════════════════════════════════════════════
   LocationHours — Map, address, hours, click-to-call
   ════════════════════════════════════════════════════════════════════════════ */
export default function LocationHours({
  restaurantData,
  theme,
}: StreetSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  const { location } = restaurantData;
  if (!location) return null;

  return (
    <section
      ref={sectionRef}
      className="relative py-16 md:py-24"
      style={{ backgroundColor: theme.background }}
    >
      {/* Top accent line */}
      <div
        className="absolute left-0 top-0 h-px w-full opacity-20"
        style={{ backgroundColor: theme.primary }}
      />

      <motion.div
        className="mx-auto max-w-6xl px-6 md:px-12"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        {/* Heading */}
        <div className="mb-10 text-center">
          <p
            className="mb-2 text-xs font-bold uppercase tracking-[0.3em]"
            style={{ color: theme.primary }}
          >
            Find Us
          </p>
          <h2
            className="text-3xl font-black uppercase tracking-tight md:text-5xl"
            style={{ color: theme.text }}
          >
            Come Through
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* ── Map ────────────────────────────────────────────────────── */}
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              border: `1px solid ${theme.text}12`,
            }}
          >
            {location.mapEmbedUrl ? (
              <iframe
                src={location.mapEmbedUrl}
                className="h-80 w-full md:h-full"
                style={{ border: 0, minHeight: "320px", filter: "invert(0.9) hue-rotate(180deg)" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Restaurant location"
              />
            ) : (
              <div
                className="flex h-80 items-center justify-center md:h-full"
                style={{
                  backgroundColor: `${theme.text}06`,
                  minHeight: "320px",
                }}
              >
                <div className="text-center">
                  <svg
                    className="mx-auto mb-3"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={theme.primary}
                    strokeWidth="1.5"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <p
                    className="text-xs uppercase tracking-wider"
                    style={{ color: `${theme.text}55` }}
                  >
                    Map placeholder
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Info panel ──────────────────────────────────────────────── */}
          <div className="flex flex-col justify-center">
            {/* Open / Closed badge */}
            <div className="mb-6 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{
                    backgroundColor: location.isOpen ? "#22c55e" : theme.accent,
                  }}
                />
                <span
                  className="relative inline-flex h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: location.isOpen ? "#22c55e" : theme.accent,
                  }}
                />
              </span>
              <span
                className="text-sm font-bold uppercase tracking-wider"
                style={{
                  color: location.isOpen ? "#22c55e" : theme.accent,
                }}
              >
                {location.isOpen ? "Open Now" : "Closed"}
              </span>
            </div>

            {/* Address */}
            <div className="mb-6">
              <p
                className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ color: `${theme.text}55` }}
              >
                Address
              </p>
              <p
                className="text-sm font-semibold leading-relaxed"
                style={{ color: theme.text }}
              >
                {location.address}
              </p>
            </div>

            {/* Hours */}
            <div className="mb-8">
              <p
                className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ color: `${theme.text}55` }}
              >
                Hours
              </p>
              <div className="space-y-1.5">
                {location.hours.map((h) => (
                  <div
                    key={h.day}
                    className="flex items-center justify-between text-xs"
                  >
                    <span
                      className="font-semibold uppercase tracking-wider"
                      style={{ color: `${theme.text}88` }}
                    >
                      {h.day}
                    </span>
                    <span
                      className="font-bold"
                      style={{ color: theme.text }}
                    >
                      {h.open} – {h.close}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Click-to-call */}
            <a
              href={`tel:${location.phone}`}
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.15em] transition-transform duration-200 hover:scale-105"
              style={{
                backgroundColor: theme.primary,
                color: theme.background,
              }}
            >
              {/* Shimmer */}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full" />
              <svg
                className="relative z-10"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              <span className="relative z-10">Call Us — {location.phone}</span>
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
