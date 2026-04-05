"use client";

import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import type { FamilySectionProps, CateringPayload } from "@/types/family-template";

/* ══════════════════════════════════════════════════════════════════════════════
   CateringForm — Simple inline catering inquiry form + WhatsApp CTA
   ════════════════════════════════════════════════════════════════════════════ */
export default function CateringForm({
  restaurantData,
  theme,
  onCateringInquiry,
}: FamilySectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState<CateringPayload>({
    name: "",
    phone: "",
    eventSize: "",
    message: "",
  });

  const updateField = <K extends keyof CateringPayload>(
    key: K,
    value: CateringPayload[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onCateringInquiry) {
      await onCateringInquiry(form);
    } else {
      // eslint-disable-next-line no-console
      console.log("[CateringForm] payload:", form);
    }
    setSubmitted(true);
  };

  /* WhatsApp link */
  const whatsappUrl = restaurantData.whatsapp
    ? `https://wa.me/${restaurantData.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hi ${restaurantData.name}! I'd like to inquire about catering for ${form.eventSize || "our"} event.`
      )}`
    : null;

  const inputClass =
    "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors duration-200 focus:ring-2";

  const inputStyle: React.CSSProperties = {
    backgroundColor: theme.background,
    borderColor: `${theme.text}15`,
    color: theme.text,
  };

  return (
    <section
      id="catering"
      ref={sectionRef}
      className="relative py-16 md:py-24"
      style={{ backgroundColor: theme.background }}
    >
      <motion.div
        className="mx-auto max-w-xl px-6 text-center md:px-12"
        initial={{ opacity: 0, y: 25 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {/* Heading */}
        <p
          className="mb-2 text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: theme.accent }}
        >
          Let Us Take Care of Everything
        </p>
        <h2
          className="mb-3 font-serif text-3xl font-bold tracking-wide md:text-4xl"
          style={{ color: theme.text }}
        >
          Catering & Events
        </h2>
        <p
          className="mb-10 text-sm leading-relaxed"
          style={{ color: `${theme.text}88` }}
        >
          From intimate family gatherings to office lunches — we bring the warmth to you.
        </p>

        {submitted ? (
          /* ── Success ─────────────────────────────────────────────────── */
          <motion.div
            className="flex flex-col items-center gap-4 py-10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: `${theme.accent}20` }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.accent}
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3
              className="font-serif text-xl font-bold"
              style={{ color: theme.text }}
            >
              Inquiry Received!
            </h3>
            <p
              className="text-sm"
              style={{ color: `${theme.text}88` }}
            >
              We&apos;ll get back to you shortly. Thank you for choosing us.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-2 text-xs font-semibold underline underline-offset-4 transition-opacity hover:opacity-80"
              style={{ color: theme.primary }}
            >
              Submit Another Inquiry
            </button>
          </motion.div>
        ) : (
          /* ── Form ────────────────────────────────────────────────────── */
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
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
                placeholder="e.g. Sarah Johnson"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className={inputClass}
                style={inputStyle}
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
                placeholder="e.g. +1 555 123 4567"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {/* Event size */}
            <div>
              <label
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
                style={{ color: `${theme.text}77` }}
              >
                Event Size
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 25 guests"
                value={form.eventSize}
                onChange={(e) => updateField("eventSize", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {/* Message */}
            <div>
              <label
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
                style={{ color: `${theme.text}77` }}
              >
                Message
              </label>
              <textarea
                rows={3}
                placeholder="Tell us about your event..."
                value={form.message}
                onChange={(e) => updateField("message", e.target.value)}
                className={`${inputClass} resize-none`}
                style={inputStyle}
              />
            </div>

            {/* Buttons row */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              {/* Submit */}
              <button
                type="submit"
                className="flex-1 rounded-full px-6 py-3.5 text-sm font-semibold tracking-wider shadow transition-transform duration-200 hover:scale-105"
                style={{
                  backgroundColor: theme.primary,
                  color: theme.background,
                }}
              >
                Send Inquiry
              </button>

              {/* WhatsApp */}
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold tracking-wider shadow transition-transform duration-200 hover:scale-105"
                  style={{
                    backgroundColor: "#25D366",
                    color: "#fff",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Chat on WhatsApp
                </a>
              )}
            </div>
          </form>
        )}
      </motion.div>
    </section>
  );
}
