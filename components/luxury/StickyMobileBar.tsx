"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RestaurantData, TemplateTheme } from "@/types/luxury-template";

/* ══════════════════════════════════════════════════════════════════════════════
   StickyMobileBar — Bottom bar visible only on mobile
   Shows next-available slot and scrolls to reservation form
   ════════════════════════════════════════════════════════════════════════════ */
interface StickyMobileBarProps {
  restaurantData: RestaurantData;
  theme: TemplateTheme;
}

export default function StickyMobileBar({
  restaurantData,
  theme,
}: StickyMobileBarProps) {
  const [visible, setVisible] = useState(false);

  /* Show bar after scrolling past the hero (first viewport) */
  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.7);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToReservation = useCallback(() => {
    const el = document.getElementById("reservation");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t px-4 py-3 backdrop-blur-lg md:hidden"
          style={{
            backgroundColor: `${theme.background}ee`,
            borderColor: `${theme.primary}33`,
          }}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {/* Info text */}
          <div className="mr-3 flex flex-col">
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: `${theme.text}88` }}
            >
              Next Available
            </span>
            <span
              className="text-sm font-bold tracking-wide"
              style={{ color: theme.text }}
            >
              {restaurantData.nextAvailable}
            </span>
          </div>

          {/* CTA button */}
          <button
            onClick={scrollToReservation}
            className="group relative shrink-0 overflow-hidden rounded-sm px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] transition-transform duration-300 hover:scale-105"
            style={{
              backgroundColor: theme.primary,
              color: theme.background,
            }}
          >
            {/* Shimmer */}
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full" />
            <span className="relative z-10">Book Now</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
