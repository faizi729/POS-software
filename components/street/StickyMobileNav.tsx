"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CartItem, StreetTheme } from "@/types/street-template";

/* ══════════════════════════════════════════════════════════════════════════════
   StickyMobileNav — Fixed bottom bar with cart + order CTA
   ════════════════════════════════════════════════════════════════════════════ */
interface StickyMobileNavProps {
  theme: StreetTheme;
  cart: CartItem[];
}

export default function StickyMobileNav({ theme, cart }: StickyMobileNavProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.5);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const totalItems = useMemo(
    () => cart.reduce((sum, c) => sum + c.quantity, 0),
    [cart]
  );

  const totalPrice = useMemo(
    () => cart.reduce((sum, c) => sum + c.price * c.quantity, 0),
    [cart]
  );

  const scrollToMenu = useCallback(() => {
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50 border-t px-4 py-3 backdrop-blur-xl md:hidden"
          style={{
            backgroundColor: `${theme.background}ee`,
            borderColor: `${theme.primary}33`,
          }}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between">
            {/* Cart info */}
            <button
              onClick={scrollToMenu}
              className="relative flex items-center gap-3"
            >
              {/* Cart icon */}
              <div className="relative">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={theme.text}
                  strokeWidth="2"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                </svg>

                {/* Badge */}
                {totalItems > 0 && (
                  <motion.span
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black"
                    style={{
                      backgroundColor: theme.accent,
                      color: "#fff",
                    }}
                    key={totalItems}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {totalItems}
                  </motion.span>
                )}
              </div>

              {/* Total */}
              {totalItems > 0 && (
                <span
                  className="text-sm font-extrabold"
                  style={{ color: theme.text }}
                >
                  ${totalPrice.toFixed(2)}
                </span>
              )}
            </button>

            {/* Order CTA */}
            <motion.button
              onClick={scrollToMenu}
              className="rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em]"
              style={{
                backgroundColor: theme.primary,
                color: theme.background,
              }}
              whileTap={{ scale: 0.95 }}
            >
              {totalItems > 0 ? "View Order" : "Order Now"}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
