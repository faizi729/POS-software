"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CityRestaurantSectionProps } from "@/types/city-restaurant-template";

/* ══════════════════════════════════════════════════════════════════════════════
   Gallery — Grid layout + click-to-open lightbox modal with prev/next
   ════════════════════════════════════════════════════════════════════════════ */
export default function Gallery({
  restaurantData,
  theme,
}: CityRestaurantSectionProps) {
  const images = restaurantData.gallery;
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const openLightbox = (idx: number) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);

  const goNext = useCallback(() => {
    setLightboxIdx((prev) => (prev !== null ? (prev + 1) % images.length : null));
  }, [images.length]);

  const goPrev = useCallback(() => {
    setLightboxIdx((prev) =>
      prev !== null ? (prev - 1 + images.length) % images.length : null
    );
  }, [images.length]);

  if (!images || images.length === 0) return null;

  return (
    <section id="gallery" className="relative py-20 md:py-28">
      {/* Section heading */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8 }}
        className="mb-12 px-6 text-center md:px-12"
      >
        <p
          className="mb-3 text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: theme.accent }}
        >
          Gallery
        </p>
        <h2
          className="font-serif text-3xl font-bold md:text-5xl"
          style={{ color: theme.text }}
        >
          A Glimpse Inside
        </h2>
      </motion.div>

      {/* Grid */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-6 md:grid-cols-3 md:gap-4 md:px-12">
        {images.map((src, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.06 }}
            onClick={() => openLightbox(idx)}
            className="group relative aspect-square overflow-hidden rounded-xl"
          >
            <img
              src={src}
              alt={`${restaurantData.name} gallery ${idx + 1}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ backgroundColor: `${theme.background}55` }}
            >
              <span className="text-2xl text-white">⤢</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Lightbox modal */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={closeLightbox}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-h-[85vh] max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={images[lightboxIdx]}
                alt={`Gallery image ${lightboxIdx + 1}`}
                className="max-h-[85vh] w-full rounded-xl object-contain"
              />

              {/* Close */}
              <button
                onClick={closeLightbox}
                className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
              >
                ✕
              </button>

              {/* Prev */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-lg text-white backdrop-blur-sm transition-colors hover:bg-white/30"
              >
                ‹
              </button>

              {/* Next */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-lg text-white backdrop-blur-sm transition-colors hover:bg-white/30"
              >
                ›
              </button>

              {/* Counter */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white/70 backdrop-blur-sm">
                {lightboxIdx + 1} / {images.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
