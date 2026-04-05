"use client";

import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import type { LuxurySectionProps, ReservationPayload } from "@/types/luxury-template";

/* ══════════════════════════════════════════════════════════════════════════════
   ReservationForm — Inline luxury reservation form
   ════════════════════════════════════════════════════════════════════════════ */

const OCCASION_OPTIONS = [
  "Dinner",
  "Birthday",
  "Anniversary",
  "Business",
  "Date Night",
  "Celebration",
  "Other",
];

const GUEST_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function ReservationForm({
  restaurantData,
  theme,
  onReserve,
}: LuxurySectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState<ReservationPayload>({
    date: "",
    time: "",
    guests: 2,
    occasion: "Dinner",
  });

  const updateField = <K extends keyof ReservationPayload>(
    key: K,
    value: ReservationPayload[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onReserve) {
      await onReserve(form);
    } else {
      // eslint-disable-next-line no-console
      console.log("[ReservationForm] payload:", form);
    }
    setSubmitted(true);
  };

  /* Shared input style */
  const inputStyle: React.CSSProperties = {
    backgroundColor: `${theme.text}08`,
    borderColor: `${theme.text}20`,
    color: theme.text,
  };

  const inputClass =
    "w-full rounded-sm border px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-[var(--lux-primary)] placeholder:opacity-40";

  return (
    <section
      id="reservation"
      ref={sectionRef}
      className="relative py-24 md:py-32"
      style={{ backgroundColor: theme.background }}
    >
      {/* Decorative top border */}
      <div
        className="absolute left-0 top-0 h-px w-full opacity-15"
        style={{ backgroundColor: theme.primary }}
      />

      <motion.div
        className="mx-auto max-w-2xl px-6 text-center md:px-12"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <p
          className="mb-3 text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: theme.primary }}
        >
          Reserve Your Experience
        </p>
        <h2
          className="mb-4 font-serif text-3xl font-bold tracking-wide md:text-4xl lg:text-5xl"
          style={{ color: theme.text }}
        >
          Book a Table
        </h2>
        <p
          className="mb-12 text-sm leading-relaxed opacity-60"
          style={{ color: theme.text }}
        >
          {restaurantData.availability}
        </p>

        {submitted ? (
          /* ── Success state ──────────────────────────────────────────── */
          <motion.div
            className="flex flex-col items-center gap-4 py-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: `${theme.primary}22` }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.primary}
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3
              className="font-serif text-2xl font-bold"
              style={{ color: theme.text }}
            >
              Reservation Received
            </h3>
            <p className="text-sm opacity-60" style={{ color: theme.text }}>
              We&apos;ll confirm your table shortly. We look forward to welcoming you.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 text-xs uppercase tracking-[0.2em] underline underline-offset-4 transition-opacity hover:opacity-80"
              style={{ color: theme.primary }}
            >
              Make Another Reservation
            </button>
          </motion.div>
        ) : (
          /* ── Form ───────────────────────────────────────────────────── */
          <form
            onSubmit={handleSubmit}
            className="grid gap-5 text-left sm:grid-cols-2"
          >
            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-[0.15em]"
                style={{ color: `${theme.text}88` }}
              >
                Date
              </label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {/* Time */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-[0.15em]"
                style={{ color: `${theme.text}88` }}
              >
                Time
              </label>
              <input
                type="time"
                required
                value={form.time}
                onChange={(e) => updateField("time", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {/* Guests */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-[0.15em]"
                style={{ color: `${theme.text}88` }}
              >
                Guests
              </label>
              <select
                value={form.guests}
                onChange={(e) =>
                  updateField("guests", parseInt(e.target.value, 10))
                }
                className={inputClass}
                style={inputStyle}
              >
                {GUEST_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "Guest" : "Guests"}
                  </option>
                ))}
              </select>
            </div>

            {/* Occasion */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-[0.15em]"
                style={{ color: `${theme.text}88` }}
              >
                Occasion
              </label>
              <select
                value={form.occasion}
                onChange={(e) => updateField("occasion", e.target.value)}
                className={inputClass}
                style={inputStyle}
              >
                {OCCASION_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit — full width */}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="group relative mt-2 w-full overflow-hidden rounded-sm px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition-transform duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: theme.primary,
                  color: theme.background,
                }}
              >
                {/* Shimmer */}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full" />
                <span className="relative z-10">Confirm Reservation</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </section>
  );
}
