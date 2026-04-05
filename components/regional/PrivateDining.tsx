"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import type {
  RegionalSectionProps,
  EventInquiryPayload,
} from "@/types/regional-template";

/* ══════════════════════════════════════════════════════════════════════════════
   PrivateDining — Events & private dining inquiry
   ════════════════════════════════════════════════════════════════════════════ */
export default function PrivateDining({
  restaurantData,
  theme,
  onEventInquiry,
}: RegionalSectionProps) {
  const events = restaurantData.events;

  const [form, setForm] = useState<EventInquiryPayload>({
    name: "",
    phone: "",
    eventType: "",
    guests: 10,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onEventInquiry) {
      onEventInquiry(form);
    } else {
      console.log("Event inquiry submitted:", form);
    }
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const updateField = (field: keyof EventInquiryPayload, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <section className="relative py-20 md:py-32" style={{ color: theme.text }}>
      {/* Section heading */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8 }}
        className="mb-14 px-6 text-center md:mb-20 md:px-12"
      >
        <p
          className="mb-3 text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: theme.primary }}
        >
          Private Dining & Events
        </p>
        <h2 className="font-serif text-3xl font-bold md:text-5xl">
          Celebrate With Us
        </h2>
      </motion.div>

      <div className="mx-auto max-w-6xl px-6 md:px-12">
        {/* Event cards */}
        {events && events.length > 0 && (
          <div className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((evt, idx) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="group overflow-hidden rounded-2xl border transition-shadow duration-300 hover:shadow-lg"
                style={{
                  borderColor: `${theme.text}10`,
                  backgroundColor: theme.background,
                }}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={evt.image}
                    alt={evt.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <h3 className="absolute bottom-3 left-4 font-serif text-lg font-bold text-white">
                    {evt.title}
                  </h3>
                </div>
                <div className="p-5">
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: `${theme.text}88` }}
                  >
                    {evt.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Inquiry form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-2xl rounded-2xl border p-8 md:p-10"
          style={{
            borderColor: `${theme.text}12`,
            backgroundColor: theme.background,
          }}
        >
          <h3
            className="mb-6 text-center font-serif text-xl font-bold md:text-2xl"
            style={{ color: theme.accent }}
          >
            Inquire About Private Dining
          </h3>

          {submitted ? (
            <div className="py-8 text-center">
              <p className="text-3xl">🎉</p>
              <p
                className="mt-3 font-serif text-lg font-semibold"
                style={{ color: theme.primary }}
              >
                Thank you! We&apos;ll be in touch soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
                  style={{ color: `${theme.text}77` }}
                >
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full rounded-lg border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:ring-2"
                  style={{
                    borderColor: `${theme.text}20`,
                    color: theme.text,
                    // @ts-expect-error CSS custom property for ring color
                    "--tw-ring-color": `${theme.primary}44`,
                  }}
                  placeholder="Full name"
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
                  style={{ color: `${theme.text}77` }}
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="w-full rounded-lg border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:ring-2"
                  style={{
                    borderColor: `${theme.text}20`,
                    color: theme.text,
                    // @ts-expect-error CSS custom property for ring color
                    "--tw-ring-color": `${theme.primary}44`,
                  }}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Event Type */}
                <div>
                  <label
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
                    style={{ color: `${theme.text}77` }}
                  >
                    Event Type
                  </label>
                  <select
                    required
                    value={form.eventType}
                    onChange={(e) => updateField("eventType", e.target.value)}
                    className="w-full rounded-lg border bg-transparent px-4 py-3 text-sm outline-none"
                    style={{
                      borderColor: `${theme.text}20`,
                      color: theme.text,
                    }}
                  >
                    <option value="">Select event type</option>
                    <option value="wedding">Wedding</option>
                    <option value="birthday">Birthday</option>
                    <option value="corporate">Corporate Event</option>
                    <option value="festival">Festival Celebration</option>
                    <option value="anniversary">Anniversary</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Guests */}
                <div>
                  <label
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
                    style={{ color: `${theme.text}77` }}
                  >
                    Number of Guests
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.guests}
                    onChange={(e) =>
                      updateField("guests", parseInt(e.target.value, 10) || 1)
                    }
                    className="w-full rounded-lg border bg-transparent px-4 py-3 text-sm outline-none"
                    style={{
                      borderColor: `${theme.text}20`,
                      color: theme.text,
                    }}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full rounded-full py-3.5 text-sm font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02]"
                style={{ backgroundColor: theme.primary }}
              >
                Send Inquiry
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
