"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { CityRestaurantSectionProps } from "@/types/city-restaurant-template";

/* ── Animated counter hook ─────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 2000, start = false) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    let rafId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration, start]);

  return value;
}

/* ══════════════════════════════════════════════════════════════════════════════
   StatsBar — 4 animated stat counters
   ════════════════════════════════════════════════════════════════════════════ */
export default function StatsBar({
  restaurantData,
  theme,
}: CityRestaurantSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const stats = [
    {
      label: "Happy Customers",
      value: restaurantData.stats.customers,
      suffix: "+",
    },
    {
      label: "Years of Excellence",
      value: restaurantData.stats.years,
      suffix: "",
    },
    {
      label: "Rating",
      value: restaurantData.rating,
      suffix: "★",
      isDecimal: true,
    },
    {
      label: "Signature Dishes",
      value: restaurantData.stats.dishes,
      suffix: "+",
    },
  ];

  const customers = useCountUp(restaurantData.stats.customers, 2000, visible);
  const years = useCountUp(restaurantData.stats.years, 1500, visible);
  const dishes = useCountUp(restaurantData.stats.dishes, 1800, visible);
  const ratingWhole = useCountUp(
    Math.floor(restaurantData.rating * 10),
    1500,
    visible
  );

  const displayValues = [
    `${customers.toLocaleString()}+`,
    `${years}`,
    `${(ratingWhole / 10).toFixed(1)}★`,
    `${dishes}+`,
  ];

  return (
    <section ref={ref} className="relative py-12 md:py-16">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `${theme.text}05` }}
      />
      <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 md:grid-cols-4 md:px-12">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            className="text-center"
          >
            <p
              className="font-serif text-3xl font-bold md:text-4xl"
              style={{ color: theme.accent }}
            >
              {displayValues[idx]}
            </p>
            <p
              className="mt-2 text-xs font-medium uppercase tracking-widest"
              style={{ color: `${theme.text}77` }}
            >
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
