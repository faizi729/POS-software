"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CityRestaurantData, CityRestaurantTheme } from "@/types/city-restaurant-template";

/* ══════════════════════════════════════════════════════════════════════════════
   FloatingUI — WhatsApp button, back-to-top, cookie notice
   ════════════════════════════════════════════════════════════════════════════ */
export default function FloatingUI({
  restaurantData,
  theme,
}: {
  restaurantData: CityRestaurantData;
  theme: CityRestaurantTheme;
}) {
  const [showTop, setShowTop] = useState(false);
  const [showCookie, setShowCookie] = useState(false);

  useEffect(() => {
    // Back-to-top visibility
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });

    // Cookie notice — check localStorage
    const dismissed = localStorage.getItem("cookie-dismissed");
    if (!dismissed) {
      const timer = setTimeout(() => setShowCookie(true), 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("scroll", onScroll);
      };
    }

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dismissCookie = () => {
    setShowCookie(false);
    localStorage.setItem("cookie-dismissed", "true");
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const waPhone = restaurantData.whatsapp?.replace(/\D/g, "");
  const waUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(
        `Hi ${restaurantData.name}! I'd like to make a reservation.`
      )}`
    : null;

  return (
    <>
      {/* WhatsApp button */}
      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform duration-300 hover:scale-110"
          style={{ backgroundColor: "#25D366" }}
          aria-label="Chat on WhatsApp"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      )}

      {/* Back to top */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border shadow-lg transition-colors duration-300 hover:scale-110"
            style={{
              right: waUrl ? "5.5rem" : "1.5rem",
              borderColor: `${theme.text}15`,
              backgroundColor: `${theme.background}ee`,
              color: theme.accent,
            }}
            aria-label="Back to top"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cookie notice */}
      <AnimatePresence>
        {showCookie && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-lg rounded-2xl border p-5 shadow-2xl md:bottom-6 md:left-6 md:right-auto"
            style={{
              borderColor: `${theme.text}12`,
              backgroundColor: theme.background,
            }}
          >
            <p className="mb-3 text-sm leading-relaxed" style={{ color: `${theme.text}bb` }}>
              🍪 We use cookies to enhance your dining experience on our website. By continuing, you agree to our use of cookies.
            </p>
            <div className="flex gap-3">
              <button
                onClick={dismissCookie}
                className="rounded-full px-5 py-2 text-xs font-semibold text-white transition-colors"
                style={{ backgroundColor: theme.primary }}
              >
                Accept
              </button>
              <button
                onClick={dismissCookie}
                className="rounded-full border px-5 py-2 text-xs font-semibold transition-colors"
                style={{ borderColor: `${theme.text}22`, color: `${theme.text}88` }}
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
