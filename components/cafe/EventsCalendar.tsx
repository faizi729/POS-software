"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { CafeSectionProps } from "@/types/cafe-template";

/* ══════════════════════════════════════════════════════════════════════════════
   EventsCalendar — Minimal event cards with RSVP
   ════════════════════════════════════════════════════════════════════════════ */
export default function EventsCalendar({
  restaurantData,
  theme,
}: CafeSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  const events = restaurantData.events;
  if (!events || events.length === 0) return null;

  return (
    <section
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
          Happening Soon
        </p>
        <h2
          className="text-2xl font-light tracking-wide md:text-3xl"
          style={{ color: theme.text }}
        >
          Events
        </h2>
      </motion.div>

      {/* Cards */}
      <div className="mx-auto max-w-4xl space-y-px px-6 md:px-12">
        {events.map((event, idx) => (
          <motion.div
            key={event.id}
            className="flex flex-col gap-4 border-t py-8 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: `${theme.text}08` }}
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: idx * 0.08 }}
          >
            {/* Left — image + info */}
            <div className="flex items-start gap-5">
              {event.image && (
                <div
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-lg"
                  style={{ border: `1px solid ${theme.text}08` }}
                >
                  <img
                    src={event.image}
                    alt={event.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              <div>
                <h3
                  className="mb-1 text-sm font-medium tracking-wide"
                  style={{ color: theme.text }}
                >
                  {event.name}
                </h3>
                <p
                  className="mb-1 text-[11px] font-medium tracking-wider"
                  style={{ color: theme.primary }}
                >
                  {event.date}
                  {event.time && ` · ${event.time}`}
                </p>
                <p
                  className="max-w-md text-xs leading-relaxed"
                  style={{ color: `${theme.text}77` }}
                >
                  {event.description}
                </p>
              </div>
            </div>

            {/* RSVP */}
            <button
              className="w-fit shrink-0 rounded-full border px-6 py-2 text-[11px] font-medium tracking-[0.15em] uppercase transition-colors duration-300 hover:bg-[var(--cafe-text)] hover:text-[var(--cafe-bg)]"
              style={{
                borderColor: theme.text,
                color: theme.text,
              }}
            >
              RSVP
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
