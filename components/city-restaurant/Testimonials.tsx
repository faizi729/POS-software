"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CityRestaurantSectionProps } from "@/types/city-restaurant-template";

/* ══════════════════════════════════════════════════════════════════════════════
   Testimonials — Auto-rotating carousel, 3 cards desktop / 1 mobile
   ════════════════════════════════════════════════════════════════════════════ */
export default function Testimonials({
  restaurantData,
  theme,
}: CityRestaurantSectionProps) {
  const reviews = restaurantData.testimonials;
  if (!reviews || reviews.length === 0) return null;

  const [activeIdx, setActiveIdx] = useState(0);

  const next = useCallback(() => {
    setActiveIdx((prev) => (prev + 1) % reviews.length);
  }, [reviews.length]);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [next]);

  // Get visible cards (up to 3 starting from activeIdx)
  const getVisibleCards = () => {
    const visible = [];
    for (let i = 0; i < Math.min(3, reviews.length); i++) {
      visible.push(reviews[(activeIdx + i) % reviews.length]);
    }
    return visible;
  };

  return (
    <section id="testimonials" className="relative py-20 md:py-28">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `${theme.text}04` }}
      />

      <div className="relative mx-auto max-w-6xl px-6 md:px-12">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="mb-14 text-center"
        >
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-[0.3em]"
            style={{ color: theme.accent }}
          >
            Testimonials
          </p>
          <h2
            className="font-serif text-3xl font-bold md:text-5xl"
            style={{ color: theme.text }}
          >
            What Our Guests Say
          </h2>
        </motion.div>

        {/* Desktop: 3-card row */}
        <div className="hidden gap-6 md:grid md:grid-cols-3">
          {getVisibleCards().map((review) => (
            <ReviewCard key={review.id} review={review} theme={theme} />
          ))}
        </div>

        {/* Mobile: single card carousel */}
        <div className="md:hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={reviews[activeIdx].id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
            >
              <ReviewCard review={reviews[activeIdx]} theme={theme} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="mt-8 flex justify-center gap-2">
          {reviews.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: idx === activeIdx ? "24px" : "8px",
                backgroundColor:
                  idx === activeIdx ? theme.accent : `${theme.text}22`,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Review Card ───────────────────────────────────────────────────────────── */
function ReviewCard({
  review,
  theme,
}: {
  review: CityRestaurantSectionProps["restaurantData"]["testimonials"][number];
  theme: CityRestaurantSectionProps["theme"];
}) {
  return (
    <div
      className="rounded-2xl border p-6"
      style={{
        borderColor: `${theme.text}10`,
        backgroundColor: `${theme.text}06`,
      }}
    >
      {/* Stars */}
      <div className="mb-4 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="text-sm"
            style={{ color: i < review.rating ? theme.accent : `${theme.text}22` }}
          >
            ★
          </span>
        ))}
      </div>

      {/* Text */}
      <p
        className="mb-5 text-sm italic leading-relaxed"
        style={{ color: `${theme.text}bb` }}
      >
        &ldquo;{review.text}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        {review.avatar && (
          <img
            src={review.avatar}
            alt={review.name}
            className="h-9 w-9 rounded-full object-cover"
          />
        )}
        <div>
          <p className="text-sm font-semibold" style={{ color: theme.text }}>
            {review.name}
          </p>
          <p className="text-xs" style={{ color: `${theme.text}55` }}>
            {review.date}
          </p>
        </div>
      </div>
    </div>
  );
}
