"use client";

import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import type { CafeSectionProps, GiftCardPayload } from "@/types/cafe-template";

/* ══════════════════════════════════════════════════════════════════════════════
   GiftCards — Select amount → enter email → purchase (simulated)
   ════════════════════════════════════════════════════════════════════════════ */
export default function GiftCards({
  restaurantData,
  theme,
  onGiftCard,
}: CafeSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  const amounts = restaurantData.giftCardAmounts;
  const currency = restaurantData.giftCurrency;
  if (!amounts || amounts.length === 0) return null;

  const [selected, setSelected] = useState(amounts[1] ?? amounts[0]);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: GiftCardPayload = {
      amount: selected,
      recipientEmail: email,
    };
    if (onGiftCard) {
      await onGiftCard(payload);
    } else {
      // eslint-disable-next-line no-console
      console.log("[GiftCards] payload:", payload);
    }
    setSent(true);
  };

  return (
    <section
      ref={sectionRef}
      className="py-[var(--space-xl)] md:py-[var(--space-2xl)]"
      style={{ backgroundColor: theme.background }}
    >
      <motion.div
        className="mx-auto max-w-md px-6 text-center md:px-12"
        initial={{ opacity: 0, y: 15 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        {/* Heading */}
        <p
          className="mb-2 text-[11px] font-medium uppercase tracking-[0.3em]"
          style={{ color: theme.accent }}
        >
          Share the Warmth
        </p>
        <h2
          className="mb-10 text-2xl font-light tracking-wide md:text-3xl"
          style={{ color: theme.text }}
        >
          Gift a Coffee
        </h2>

        {sent ? (
          /* ── Success ─────────────────────────────────────────────────── */
          <motion.div
            className="flex flex-col items-center gap-3 py-8"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-3xl">🎉</span>
            <h3
              className="text-lg font-light tracking-wide"
              style={{ color: theme.text }}
            >
              Gift Card Sent!
            </h3>
            <p
              className="text-xs"
              style={{ color: `${theme.text}77` }}
            >
              {currency}{selected} gift card on its way to {email}
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="mt-4 text-[11px] font-medium tracking-wider underline underline-offset-4 transition-opacity hover:opacity-70"
              style={{ color: theme.primary }}
            >
              Send Another
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handlePurchase} className="space-y-8">
            {/* ── Amount selector ────────────────────────────────────── */}
            <div className="flex flex-wrap justify-center gap-3">
              {amounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setSelected(amt)}
                  className="rounded-full border px-6 py-3 text-sm font-light tracking-wider transition-colors duration-200"
                  style={{
                    borderColor:
                      selected === amt ? theme.text : `${theme.text}12`,
                    color:
                      selected === amt ? theme.text : `${theme.text}55`,
                    backgroundColor:
                      selected === amt ? `${theme.text}06` : "transparent",
                  }}
                >
                  {currency}{amt}
                </button>
              ))}
            </div>

            {/* ── Email input ────────────────────────────────────────── */}
            <div>
              <label
                className="mb-2 block text-[11px] font-medium uppercase tracking-[0.2em]"
                style={{ color: `${theme.text}66` }}
              >
                Recipient Email
              </label>
              <input
                type="email"
                required
                placeholder="friend@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-b bg-transparent py-3 text-sm tracking-wider outline-none transition-colors duration-200 placeholder:opacity-30 focus:border-[var(--cafe-primary)]"
                style={{
                  borderColor: `${theme.text}15`,
                  color: theme.text,
                }}
              />
            </div>

            {/* ── Purchase button ────────────────────────────────────── */}
            <button
              type="submit"
              className="w-full rounded-full border py-3.5 text-xs font-medium tracking-[0.2em] uppercase transition-colors duration-300 hover:bg-[var(--cafe-text)] hover:text-[var(--cafe-bg)]"
              style={{
                borderColor: theme.text,
                color: theme.text,
              }}
            >
              Purchase {currency}{selected} Gift Card
            </button>
          </form>
        )}
      </motion.div>
    </section>
  );
}
