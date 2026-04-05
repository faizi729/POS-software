"use client";

import React, { useRef, useState, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import type { LuxurySectionProps } from "@/types/luxury-template";

/* ══════════════════════════════════════════════════════════════════════════════
   TestimonialsLuxury — Full-width cinematic quote carousel
   ════════════════════════════════════════════════════════════════════════════ */
export default function TestimonialsLuxury({
  restaurantData,
  theme,
}: LuxurySectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const [active, setActive] = useState(0);

  const { reviews } = restaurantData;
  if (!reviews || reviews.length === 0) return null;

  const review = reviews[active];

  const goTo = useCallback(
    (dir: 1 | -1) =>
      setActive((prev) => {
        const next = prev + dir;
        if (next < 0) return reviews.length - 1;
        if (next >= reviews.length) return 0;
        return next;
      }),
    [reviews.length]
  );

  /* Render stars */
  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={i < rating ? theme.primary : "none"}
        stroke={theme.primary}
        strokeWidth="1.5"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ));

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-24 md:py-32"
      style={{ backgroundColor: theme.background }}
    >
      {/* Decorative top border */}
      <div
        className="absolute left-0 top-0 h-px w-full opacity-15"
        style={{ backgroundColor: theme.primary }}
      />

      <motion.div
        className="mx-auto max-w-4xl px-6 text-center md:px-12"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Label */}
        <p
          className="mb-6 text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: theme.primary }}
        >
          Guest Experiences
        </p>

        {/* Quote area */}
        <div className="relative min-h-[260px] md:min-h-[220px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Opening quote */}
              <span
                className="mb-2 block font-serif text-5xl leading-none opacity-25 md:text-7xl"
                style={{ color: theme.primary }}
              >
                &ldquo;
              </span>

              {/* Review text */}
              <blockquote
                className="-mt-6 mb-8 font-serif text-xl italic leading-relaxed tracking-wide md:text-2xl lg:text-3xl"
                style={{ color: theme.text }}
              >
                {review.text}
              </blockquote>

              {/* Stars */}
              <div className="mb-4 flex items-center justify-center gap-1">
                {renderStars(review.rating)}
              </div>

              {/* Author + Source */}
              <div className="flex flex-col items-center gap-1">
                <span
                  className="text-sm font-semibold tracking-wider"
                  style={{ color: theme.text }}
                >
                  {review.author}
                </span>
                <span
                  className="text-xs uppercase tracking-[0.2em] opacity-60"
                  style={{ color: theme.text }}
                >
                  via {review.source}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-center gap-6">
          <button
            onClick={() => goTo(-1)}
            className="p-2 transition-opacity hover:opacity-80"
            style={{ color: theme.primary }}
            aria-label="Previous review"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="h-2 w-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i === active ? theme.primary : `${theme.text}33`,
                  transform: i === active ? "scale(1.4)" : "scale(1)",
                }}
                aria-label={`Go to review ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => goTo(1)}
            className="p-2 transition-opacity hover:opacity-80"
            style={{ color: theme.primary }}
            aria-label="Next review"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </motion.div>
    </section>
  );
}
