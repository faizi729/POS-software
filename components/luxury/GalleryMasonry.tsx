"use client";

import React, { useCallback, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import type { LuxurySectionProps } from "@/types/luxury-template";

/* ══════════════════════════════════════════════════════════════════════════════
   GalleryMasonry — Masonry grid with lightbox
   ════════════════════════════════════════════════════════════════════════════ */
export default function GalleryMasonry({
  restaurantData,
  theme,
}: LuxurySectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const { gallery } = restaurantData;
  if (!gallery || gallery.length === 0) return null;

  const openLightbox = useCallback((idx: number) => setLightboxIdx(idx), []);
  const closeLightbox = useCallback(() => setLightboxIdx(null), []);

  const navigateLightbox = useCallback(
    (dir: 1 | -1) => {
      setLightboxIdx((prev) => {
        if (prev === null) return null;
        const next = prev + dir;
        if (next < 0) return gallery.length - 1;
        if (next >= gallery.length) return 0;
        return next;
      });
    },
    [gallery.length]
  );

  /* Masonry span classes based on hint */
  const spanClass = (span?: string) => {
    switch (span) {
      case "tall":
        return "row-span-2";
      case "wide":
        return "col-span-2";
      default:
        return "";
    }
  };

  return (
    <>
      <section
        ref={sectionRef}
        className="relative py-20 md:py-28"
        style={{ backgroundColor: theme.background }}
      >
        {/* Section heading */}
        <motion.div
          className="mb-12 px-6 text-center md:px-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-[0.3em]"
            style={{ color: theme.primary }}
          >
            A Visual Journey
          </p>
          <h2
            className="font-serif text-3xl font-bold tracking-wide md:text-4xl lg:text-5xl"
            style={{ color: theme.text }}
          >
            The Experience
          </h2>
        </motion.div>

        {/* Masonry grid */}
        <div className="mx-auto grid max-w-7xl auto-rows-[200px] grid-cols-2 gap-3 px-6 md:auto-rows-[260px] md:grid-cols-3 md:gap-4 md:px-12 lg:grid-cols-4">
          {gallery.map((img, idx) => (
            <motion.button
              key={img.id}
              className={`group relative overflow-hidden rounded-sm ${spanClass(img.span)}`}
              onClick={() => openLightbox(idx)}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.5,
                delay: idx * 0.08,
                ease: "easeOut",
              }}
              aria-label={`View ${img.alt}`}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                loading="lazy"
              />
              {/* Hover overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ backgroundColor: `${theme.background}88` }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={theme.primary}
                  strokeWidth="1.5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                  <path d="M11 8v6M8 11h6" />
                </svg>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ── Lightbox Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: `${theme.background}ee` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            {/* Close button */}
            <button
              className="absolute right-6 top-6 p-2 transition-opacity hover:opacity-80"
              style={{ color: theme.text }}
              onClick={closeLightbox}
              aria-label="Close lightbox"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Prev */}
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 transition-opacity hover:opacity-80 md:left-8"
              style={{ color: theme.text }}
              onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
              aria-label="Previous image"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {/* Image */}
            <motion.img
              key={lightboxIdx}
              src={gallery[lightboxIdx].src}
              alt={gallery[lightboxIdx].alt}
              className="max-h-[85vh] max-w-[90vw] rounded-sm object-contain"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Next */}
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 transition-opacity hover:opacity-80 md:right-8"
              style={{ color: theme.text }}
              onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
              aria-label="Next image"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* Counter */}
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm tracking-widest"
              style={{ color: `${theme.text}88` }}
            >
              {lightboxIdx + 1} / {gallery.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
