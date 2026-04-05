"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { StreetSectionProps } from "@/types/street-template";

/* ══════════════════════════════════════════════════════════════════════════════
   RewardsPunch — Loyalty punch-card UI
   ════════════════════════════════════════════════════════════════════════════ */
export default function RewardsPunch({
  restaurantData,
  theme,
}: StreetSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  const { rewards } = restaurantData;
  if (!rewards) return null;

  const { current, total, rewardText } = rewards;

  return (
    <section
      ref={sectionRef}
      className="relative py-16 md:py-24"
      style={{ backgroundColor: theme.background }}
    >
      <motion.div
        className="mx-auto max-w-lg px-6 text-center md:px-12"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        {/* Heading */}
        <p
          className="mb-2 text-xs font-bold uppercase tracking-[0.3em]"
          style={{ color: theme.accent }}
        >
          Loyalty Rewards
        </p>
        <h2
          className="mb-8 text-3xl font-black uppercase tracking-tight md:text-5xl"
          style={{ color: theme.text }}
        >
          Your Punch Card
        </h2>

        {/* ── Punch card ───────────────────────────────────────────────── */}
        <div
          className="relative mx-auto max-w-md overflow-hidden rounded-2xl p-6"
          style={{
            backgroundColor: `${theme.text}06`,
            border: `1px solid ${theme.text}12`,
          }}
        >
          {/* Neon glow */}
          <div
            className="absolute -left-4 -top-4 h-32 w-32 rounded-full opacity-30 blur-3xl"
            style={{ backgroundColor: theme.primary }}
          />

          {/* Punches grid */}
          <div className="relative mb-6 grid grid-cols-5 gap-3">
            {Array.from({ length: total }, (_, i) => {
              const filled = i < current;
              const isReward = i === total - 1;

              return (
                <motion.div
                  key={i}
                  className="relative flex aspect-square items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: filled
                      ? `${theme.primary}25`
                      : `${theme.text}08`,
                    border: `2px solid ${
                      isReward
                        ? theme.accent
                        : filled
                          ? theme.primary
                          : `${theme.text}15`
                    }`,
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{
                    duration: 0.3,
                    delay: i * 0.06,
                    ease: "easeOut",
                  }}
                >
                  {filled ? (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={theme.primary}
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : isReward ? (
                    <span className="text-lg">🎁</span>
                  ) : (
                    <span
                      className="text-lg font-black opacity-20"
                      style={{ color: theme.text }}
                    >
                      {i + 1}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Progress text */}
          <p
            className="mb-2 text-sm font-extrabold uppercase tracking-wider"
            style={{ color: theme.text }}
          >
            {current} / {total} Punches
          </p>

          {/* Reward label */}
          <p
            className="text-xs tracking-wider"
            style={{ color: `${theme.text}77` }}
          >
            {rewardText}
          </p>

          {/* Progress bar */}
          <div
            className="mt-5 h-2 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: `${theme.text}10` }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`,
              }}
              initial={{ width: "0%" }}
              animate={
                isInView
                  ? { width: `${(current / total) * 100}%` }
                  : { width: "0%" }
              }
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
