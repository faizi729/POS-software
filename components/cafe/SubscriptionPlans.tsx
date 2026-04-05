"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { CafeSectionProps } from "@/types/cafe-template";

/* ══════════════════════════════════════════════════════════════════════════════
   SubscriptionPlans — Minimal pricing tiers for coffee subscriptions
   ════════════════════════════════════════════════════════════════════════════ */
export default function SubscriptionPlans({
  restaurantData,
  theme,
}: CafeSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  const plans = restaurantData.subscriptionPlans;
  if (!plans || plans.length === 0) return null;

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
          Never Run Out
        </p>
        <h2
          className="text-2xl font-light tracking-wide md:text-3xl"
          style={{ color: theme.text }}
        >
          Coffee Subscriptions
        </h2>
      </motion.div>

      {/* Cards */}
      <div className="mx-auto grid max-w-4xl gap-px px-6 sm:grid-cols-3 md:px-12">
        {plans.map((plan, idx) => (
          <motion.div
            key={plan.id}
            className="relative flex flex-col border p-8"
            style={{
              borderColor: plan.highlighted ? theme.primary : `${theme.text}10`,
              backgroundColor: plan.highlighted
                ? `${theme.primary}06`
                : theme.background,
            }}
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
          >
            {/* Highlighted label */}
            {plan.highlighted && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border px-4 py-1 text-[10px] font-medium tracking-[0.2em] uppercase"
                style={{
                  borderColor: theme.primary,
                  color: theme.primary,
                  backgroundColor: theme.background,
                }}
              >
                Popular
              </span>
            )}

            {/* Tier name */}
            <h3
              className="mb-1 text-xs font-medium uppercase tracking-[0.2em]"
              style={{ color: `${theme.text}66` }}
            >
              {plan.tier}
            </h3>

            {/* Price */}
            <div className="mb-6">
              <span
                className="text-3xl font-light tracking-wide"
                style={{ color: theme.text }}
              >
                {plan.currency}{plan.price}
              </span>
              <span
                className="text-xs tracking-wider"
                style={{ color: `${theme.text}55` }}
              >
                /{plan.period}
              </span>
            </div>

            {/* Benefits */}
            <ul className="mb-8 flex-1 space-y-3">
              {plan.benefits.map((benefit, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs leading-relaxed"
                  style={{ color: `${theme.text}88` }}
                >
                  <svg
                    className="mt-0.5 shrink-0"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={theme.accent}
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              className="w-full rounded-full border py-3 text-xs font-medium tracking-[0.15em] uppercase transition-colors duration-300"
              style={{
                borderColor: plan.highlighted ? theme.primary : theme.text,
                color: plan.highlighted ? theme.background : theme.text,
                backgroundColor: plan.highlighted
                  ? theme.primary
                  : "transparent",
              }}
            >
              Subscribe
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
