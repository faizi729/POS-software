"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CityRestaurantData, CityRestaurantTheme } from "@/types/city-restaurant-template";

/* ══════════════════════════════════════════════════════════════════════════════
   Navbar — Fixed top, transparent → blurred on scroll, mobile hamburger
   ════════════════════════════════════════════════════════════════════════════ */
export default function Navbar({
  restaurantData,
  theme,
}: {
  restaurantData: CityRestaurantData;
  theme: CityRestaurantTheme;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <nav
        className="fixed left-0 right-0 top-0 z-50 transition-all duration-500"
        style={{
          backgroundColor: scrolled ? `${theme.background}ee` : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? `1px solid ${theme.text}10` : "1px solid transparent",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          {/* Logo / Name */}
          <button
            onClick={() => scrollTo("#hero")}
            className="font-serif text-xl font-bold tracking-tight md:text-2xl"
            style={{ color: theme.accent }}
          >
            {restaurantData.name}
          </button>

          {/* Desktop links */}
          <div className="hidden items-center gap-8 md:flex">
            {restaurantData.navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="text-sm font-medium tracking-wide transition-colors duration-300 hover:opacity-100"
                style={{ color: `${theme.text}bb` }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = theme.accent)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = `${theme.text}bb`)
                }
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => scrollTo("#reservation")}
              className="rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: theme.primary, color: "#fff" }}
            >
              Reserve
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
            aria-label="Toggle menu"
          >
            <span
              className="block h-0.5 w-6 rounded-full transition-all duration-300"
              style={{
                backgroundColor: theme.text,
                transform: menuOpen ? "rotate(45deg) translate(2px, 4px)" : "none",
              }}
            />
            <span
              className="block h-0.5 w-6 rounded-full transition-all duration-300"
              style={{
                backgroundColor: theme.text,
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              className="block h-0.5 w-6 rounded-full transition-all duration-300"
              style={{
                backgroundColor: theme.text,
                transform: menuOpen ? "rotate(-45deg) translate(2px, -4px)" : "none",
              }}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 md:hidden"
            style={{ backgroundColor: `${theme.background}f5` }}
          >
            {restaurantData.navLinks.map((link, idx) => (
              <motion.button
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                onClick={() => scrollTo(link.href)}
                className="font-serif text-2xl font-medium tracking-wide"
                style={{ color: theme.text }}
              >
                {link.label}
              </motion.button>
            ))}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: restaurantData.navLinks.length * 0.08 }}
              onClick={() => scrollTo("#reservation")}
              className="mt-4 rounded-full px-8 py-3 text-sm font-semibold"
              style={{ backgroundColor: theme.primary, color: "#fff" }}
            >
              Reserve a Table
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
