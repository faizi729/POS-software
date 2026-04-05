"use client";

import React, { useRef, useMemo, useState } from "react";
import { motion, useInView } from "framer-motion";
import type { FamilySectionProps } from "@/types/family-template";

/* ══════════════════════════════════════════════════════════════════════════════
   MenuOccasionTabs — Menu filtered by occasion tabs
   ════════════════════════════════════════════════════════════════════════════ */
const OCCASIONS = [
  { key: "sunday-lunch", label: "🍽️ Sunday Lunch", icon: "🌞" },
  { key: "kids", label: "🧒 Kids Menu", icon: "🎈" },
  { key: "birthday", label: "🎂 Birthday Packages", icon: "🎉" },
  { key: "catering", label: "🍱 Corporate Catering", icon: "💼" },
];

export default function MenuOccasionTabs({
  menuData,
  theme,
}: FamilySectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });
  const [activeTab, setActiveTab] = useState(OCCASIONS[0].key);

  const filteredItems = useMemo(
    () => menuData.items.filter((item) => item.occasion === activeTab),
    [menuData.items, activeTab]
  );

  return (
    <section
      id="menu"
      ref={sectionRef}
      className="relative py-16 md:py-24"
      style={{ backgroundColor: theme.background }}
    >
      {/* Heading */}
      <motion.div
        className="mb-10 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <p
          className="mb-2 text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: theme.accent }}
        >
          Something for Everyone
        </p>
        <h2
          className="font-serif text-3xl font-bold tracking-wide md:text-4xl"
          style={{ color: theme.text }}
        >
          Our Menu
        </h2>
      </motion.div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="no-scrollbar mb-10 flex gap-2 overflow-x-auto px-6 md:justify-center md:gap-3 md:px-12">
        {OCCASIONS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold tracking-wider transition-all duration-200"
            style={{
              backgroundColor:
                activeTab === tab.key
                  ? theme.primary
                  : `${theme.text}08`,
              color:
                activeTab === tab.key
                  ? theme.background
                  : `${theme.text}88`,
              border: `1px solid ${
                activeTab === tab.key ? theme.primary : `${theme.text}12`
              }`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Items ──────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-4xl px-6 md:px-12">
        {filteredItems.length === 0 ? (
          <p
            className="py-12 text-center text-sm italic"
            style={{ color: `${theme.text}66` }}
          >
            No items available for this occasion yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredItems.map((item, idx) => (
              <motion.div
                key={item.id}
                className="flex gap-4 overflow-hidden rounded-2xl p-4 transition-shadow duration-200 hover:shadow-md"
                style={{
                  backgroundColor: theme.background,
                  border: `1px solid ${theme.text}08`,
                  boxShadow: `0 2px 12px ${theme.text}06`,
                }}
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.08,
                  ease: "easeOut",
                }}
              >
                {/* Image */}
                {item.image && (
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="flex flex-1 flex-col justify-center">
                  <div className="mb-1 flex items-start justify-between">
                    <h3
                      className="text-sm font-bold tracking-wide"
                      style={{ color: theme.text }}
                    >
                      {item.name}
                    </h3>
                    <span
                      className="shrink-0 font-serif text-sm font-bold"
                      style={{ color: theme.primary }}
                    >
                      {item.currency}{item.price}
                    </span>
                  </div>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: `${theme.text}88` }}
                  >
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
