"use client";

import React, { useCallback, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import type { CafeSectionProps } from "@/types/cafe-template";

/* ══════════════════════════════════════════════════════════════════════════════
   SpaceGallery — Interactive seating zone selector
   ════════════════════════════════════════════════════════════════════════════ */
const ZONE_LABELS: Record<string, { label: string; icon: string }> = {
  "window-seat": { label: "Window Seat", icon: "🪟" },
  couch: { label: "Couch Corner", icon: "🛋️" },
  bar: { label: "Coffee Bar", icon: "☕" },
};

export default function SpaceGallery({
  restaurantData,
  theme,
}: CafeSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  const images = restaurantData.spaceImages;
  if (!images || images.length === 0) return null;

  const zones = [...new Set(images.map((i) => i.zone))];
  const [activeZone, setActiveZone] = useState(zones[0]);
  const [modalImg, setModalImg] = useState<string | null>(null);

  const filtered = images.filter((i) => i.zone === activeZone);

  const openModal = useCallback((src: string) => setModalImg(src), []);
  const closeModal = useCallback(() => setModalImg(null), []);

  return (
    <>
      <section
        id="the-space"
        ref={sectionRef}
        className="py-[var(--space-xl)] md:py-[var(--space-2xl)]"
        style={{ backgroundColor: theme.background }}
      >
        {/* Heading */}
        <motion.div
          className="mb-[var(--space-lg)] px-6 text-center md:px-12"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p
            className="mb-2 text-[11px] font-medium uppercase tracking-[0.3em]"
            style={{ color: theme.accent }}
          >
            Where Will You Sit?
          </p>
          <h2
            className="text-2xl font-light tracking-wide md:text-3xl"
            style={{ color: theme.text }}
          >
            The Space
          </h2>
        </motion.div>

        {/* Zone selector */}
        <div className="mb-10 flex justify-center gap-3 px-6">
          {zones.map((zone) => {
            const meta = ZONE_LABELS[zone] ?? { label: zone, icon: "📍" };
            return (
              <button
                key={zone}
                onClick={() => setActiveZone(zone)}
                className="flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-medium tracking-wider transition-colors duration-200"
                style={{
                  borderColor:
                    activeZone === zone ? theme.text : `${theme.text}12`,
                  color:
                    activeZone === zone ? theme.text : `${theme.text}55`,
                  backgroundColor:
                    activeZone === zone ? `${theme.text}06` : "transparent",
                }}
              >
                <span>{meta.icon}</span>
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* Image grid */}
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-6 md:grid-cols-3 md:gap-4 md:px-12">
          <AnimatePresence mode="wait">
            {filtered.map((img, idx) => (
              <motion.button
                key={img.id}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg"
                style={{ border: `1px solid ${theme.text}08` }}
                onClick={() => openModal(img.src)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                aria-label={`View ${img.alt}`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Lightbox modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalImg && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ backgroundColor: `${theme.background}ee` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <button
              className="absolute right-6 top-6 p-2 transition-opacity hover:opacity-70"
              style={{ color: theme.text }}
              onClick={closeModal}
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <motion.img
              src={modalImg}
              alt="Space preview"
              className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
