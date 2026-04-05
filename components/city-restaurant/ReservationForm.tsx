"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import type {
  CityRestaurantSectionProps,
  ReservationPayload,
} from "@/types/city-restaurant-template";

/* ══════════════════════════════════════════════════════════════════════════════
   ReservationForm — Controlled inline form with success state
   ════════════════════════════════════════════════════════════════════════════ */
export default function ReservationForm({
  restaurantData,
  theme,
  onReserve,
}: CityRestaurantSectionProps) {
  const [form, setForm] = useState<ReservationPayload>({
    name: "",
    phone: "",
    date: "",
    time: "",
    guests: 2,
    occasion: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const update = (field: keyof ReservationPayload, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onReserve) {
      onReserve(form);
    } else {
      console.log("Reservation submitted:", form);
    }
    setSubmitted(true);
  };

  const inputStyle: React.CSSProperties = {
    borderColor: `${theme.text}15`,
    backgroundColor: `${theme.text}06`,
    color: theme.text,
  };

  return (
    <section id="reservation" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-6 md:px-12">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-[0.3em]"
            style={{ color: theme.accent }}
          >
            Reservations
          </p>
          <h2
            className="font-serif text-3xl font-bold md:text-5xl"
            style={{ color: theme.text }}
          >
            Book Your Table
          </h2>
          <p
            className="mx-auto mt-4 max-w-lg text-sm leading-relaxed"
            style={{ color: `${theme.text}77` }}
          >
            Reserve your dining experience at {restaurantData.name}. Walk-ins welcome, but reservations guarantee your table.
          </p>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="rounded-2xl border p-8 md:p-10"
          style={{
            borderColor: `${theme.text}10`,
            backgroundColor: `${theme.text}04`,
          }}
        >
          {submitted ? (
            <div className="py-12 text-center">
              <p className="mb-4 text-4xl">🎉</p>
              <h3
                className="mb-2 font-serif text-2xl font-bold"
                style={{ color: theme.accent }}
              >
                Reservation Confirmed!
              </h3>
              <p className="mb-6 text-sm" style={{ color: `${theme.text}88` }}>
                We&apos;ve received your reservation. You&apos;ll receive a confirmation shortly.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: "", phone: "", date: "", time: "", guests: 2, occasion: "" });
                }}
                className="rounded-full border px-6 py-2 text-sm font-medium transition-colors"
                style={{ borderColor: `${theme.text}22`, color: theme.text }}
              >
                Make Another Reservation
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                {/* Name */}
                <div>
                  <label
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
                    style={{ color: `${theme.text}66` }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors"
                    style={inputStyle}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
                    style={{ color: `${theme.text}66` }}
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors"
                    style={inputStyle}
                  />
                </div>

                {/* Date */}
                <div>
                  <label
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
                    style={{ color: `${theme.text}66` }}
                  >
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => update("date", e.target.value)}
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors"
                    style={inputStyle}
                  />
                </div>

                {/* Time */}
                <div>
                  <label
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
                    style={{ color: `${theme.text}66` }}
                  >
                    Time
                  </label>
                  <input
                    type="time"
                    required
                    value={form.time}
                    onChange={(e) => update("time", e.target.value)}
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors"
                    style={inputStyle}
                  />
                </div>

                {/* Guests */}
                <div>
                  <label
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
                    style={{ color: `${theme.text}66` }}
                  >
                    Number of Guests
                  </label>
                  <select
                    value={form.guests}
                    onChange={(e) => update("guests", parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "Guest" : "Guests"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Occasion */}
                <div>
                  <label
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
                    style={{ color: `${theme.text}66` }}
                  >
                    Occasion (optional)
                  </label>
                  <select
                    value={form.occasion}
                    onChange={(e) => update("occasion", e.target.value)}
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  >
                    <option value="">Select occasion</option>
                    <option value="birthday">Birthday</option>
                    <option value="anniversary">Anniversary</option>
                    <option value="date-night">Date Night</option>
                    <option value="business">Business Dinner</option>
                    <option value="celebration">Celebration</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full rounded-full py-3.5 text-sm font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.01]"
                style={{ backgroundColor: theme.primary }}
              >
                Confirm Reservation
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
