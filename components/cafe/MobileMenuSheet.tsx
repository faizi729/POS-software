"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CafeMenuData, CafeTheme } from "@/types/cafe-template";

/* ══════════════════════════════════════════════════════════════════════════════
   MobileMenuSheet — Bottom-sheet menu overlay (mobile only)
   ════════════════════════════════════════════════════════════════════════════ */
interface MobileMenuSheetProps {
  menuData: CafeMenuData;
  theme: CafeTheme;
}

export default function MobileMenuSheet({
  menuData,
  theme,
}: MobileMenuSheetProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  /* Show trigger button after scrolling past hero */
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.5);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggle = useCallback(() => setOpen((p) => !p), []);

  const items = menuData.items;

  return (
    <>
      {/* ── Floating trigger (mobile only) ─────────────────────────────── */}
      <AnimatePresence>
        {visible && !open && (
          <motion.button
            className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border md:hidden"
            style={{
              backgroundColor: theme.background,
              borderColor: `${theme.text}15`,
              color: theme.text,
            }}
            onClick={toggle}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.25 }}
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Bottom sheet overlay ────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 md:hidden"
              style={{ backgroundColor: `${theme.text}20` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggle}
            />

            {/* Sheet */}
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t md:hidden"
              style={{
                backgroundColor: theme.background,
                borderColor: `${theme.text}10`,
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {/* Handle */}
              <div className="sticky top-0 flex justify-center pb-4 pt-3" style={{ backgroundColor: theme.background }}>
                <div
                  className="h-1 w-10 rounded-full"
                  style={{ backgroundColor: `${theme.text}20` }}
                />
              </div>

              {/* Close */}
              <div className="flex items-center justify-between px-6 pb-4">
                <h3
                  className="text-sm font-medium tracking-wide"
                  style={{ color: theme.text }}
                >
                  Menu
                </h3>
                <button
                  onClick={toggle}
                  className="p-1 transition-opacity hover:opacity-70"
                  style={{ color: `${theme.text}66` }}
                  aria-label="Close menu"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Items */}
              <div className="space-y-px px-6 pb-8">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-t py-4"
                    style={{ borderColor: `${theme.text}06` }}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-10 w-10 rounded-md object-cover"
                        loading="lazy"
                      />
                      <div>
                        <p
                          className="text-xs font-medium tracking-wide"
                          style={{ color: theme.text }}
                        >
                          {item.name}
                        </p>
                        <div className="mt-0.5 flex gap-1">
                          {item.tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="text-[9px] tracking-wider"
                              style={{ color: `${theme.text}55` }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span
                      className="text-xs font-medium"
                      style={{ color: theme.primary }}
                    >
                      {item.currency}{item.price}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
