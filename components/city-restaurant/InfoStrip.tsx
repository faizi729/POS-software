"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { CityRestaurantSectionProps } from "@/types/city-restaurant-template";

/* ══════════════════════════════════════════════════════════════════════════════
   InfoStrip — Location, hours (with open/closed), and contact
   ════════════════════════════════════════════════════════════════════════════ */
export default function InfoStrip({
  restaurantData,
  theme,
}: CityRestaurantSectionProps) {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    // Simple heuristic: weekdays 11-23, weekends 10-24
    if (day === 0 || day === 6) {
      setIsOpen(hour >= 10 && hour < 24);
    } else {
      setIsOpen(hour >= 11 && hour < 23);
    }
  }, []);

  const cards = [
    {
      icon: "📍",
      title: "Visit Us",
      content: restaurantData.location,
      action: null,
    },
    {
      icon: "🕐",
      title: "Opening Hours",
      content: (
        <>
          <span className="block">
            Mon–Fri: {restaurantData.openingHours.weekdays}
          </span>
          <span className="block">
            Sat–Sun: {restaurantData.openingHours.weekends}
          </span>
        </>
      ),
      badge: isOpen,
    },
    {
      icon: "📞",
      title: "Contact",
      content: restaurantData.phone,
      action: `tel:${restaurantData.phone.replace(/\s+/g, "")}`,
    },
  ];

  return (
    <section id="contact" className="relative py-16 md:py-24">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `${theme.text}04` }}
      />

      <div className="relative mx-auto grid max-w-5xl gap-6 px-6 md:grid-cols-3 md:px-12">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            className="rounded-2xl border p-6 text-center"
            style={{
              borderColor: `${theme.text}10`,
              backgroundColor: `${theme.text}06`,
            }}
          >
            <p className="mb-3 text-2xl">{card.icon}</p>
            <h4
              className="mb-2 text-sm font-bold uppercase tracking-wider"
              style={{ color: theme.accent }}
            >
              {card.title}
            </h4>

            {/* Open/Closed badge */}
            {"badge" in card && card.badge !== undefined && card.badge !== null && (
              <span
                className="mb-2 inline-block rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: card.badge ? "#15803d22" : "#b4231822",
                  color: card.badge ? "#22c55e" : "#ef4444",
                }}
              >
                {card.badge ? "Open Now" : "Closed"}
              </span>
            )}

            <div className="text-sm leading-relaxed" style={{ color: `${theme.text}88` }}>
              {card.action ? (
                <a
                  href={card.action}
                  className="transition-colors hover:underline"
                  style={{ color: theme.primary }}
                >
                  {card.content}
                </a>
              ) : (
                card.content
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
