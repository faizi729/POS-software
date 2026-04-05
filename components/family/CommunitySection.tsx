"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { FamilySectionProps } from "@/types/family-template";

/* ══════════════════════════════════════════════════════════════════════════════
   CommunitySection — Events, classes, and loyalty cards
   ════════════════════════════════════════════════════════════════════════════ */
export default function CommunitySection({
  restaurantData,
  theme,
}: FamilySectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  const events = restaurantData.community;
  if (!events || events.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="relative py-16 md:py-24"
      style={{ backgroundColor: theme.background }}
    >
      {/* Heading */}
      <motion.div
        className="mb-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <p
          className="mb-2 text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: theme.accent }}
        >
          Be Part of the Family
        </p>
        <h2
          className="font-serif text-3xl font-bold tracking-wide md:text-4xl"
          style={{ color: theme.text }}
        >
          Community & Events
        </h2>
      </motion.div>

      {/* Cards grid */}
      <div className="mx-auto grid max-w-5xl gap-6 px-6 sm:grid-cols-2 md:px-12 lg:grid-cols-3">
        {events.map((event, idx) => (
          <motion.div
            key={event.id}
            className="group overflow-hidden rounded-2xl transition-shadow duration-200 hover:shadow-lg"
            style={{
              backgroundColor: theme.background,
              border: `1px solid ${theme.text}08`,
              boxShadow: `0 4px 20px ${theme.text}06`,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.6,
              delay: idx * 0.1,
              ease: "easeOut",
            }}
          >
            {/* Image */}
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src={event.image}
                alt={event.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              {/* Tag */}
              {event.tag && (
                <span
                  className="absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: theme.accent,
                    color: theme.background,
                  }}
                >
                  {event.tag}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              {/* Date */}
              {event.date && (
                <p
                  className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: theme.primary }}
                >
                  {event.date}
                </p>
              )}

              <h3
                className="mb-2 text-sm font-bold tracking-wide"
                style={{ color: theme.text }}
              >
                {event.title}
              </h3>

              <p
                className="text-xs leading-relaxed"
                style={{ color: `${theme.text}88` }}
              >
                {event.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
