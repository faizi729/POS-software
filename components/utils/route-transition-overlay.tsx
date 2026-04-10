"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";
import { motionTokens } from "@/lib/motion";
import { useUiStore } from "@/store/ui-store";

export function RouteTransitionOverlay({ className }: { className?: string }) {
  const pathname = usePathname();
  const { routeLoading, stopRouteLoading } = useUiStore();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    // On first mount, just initialize the ref.
    if (prevPathRef.current == null) {
      prevPathRef.current = pathname;
      return;
    }

    // When pathname changes, navigation has completed -> hide loader.
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      // small delay makes it feel intentional vs flicker
      const t = setTimeout(() => stopRouteLoading(), 120);
      return () => clearTimeout(t);
    }
  }, [pathname, stopRouteLoading]);

  return (
    <AnimatePresence>
      {routeLoading ? (
        <motion.div
          key="route-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionTokens.durations.normal, ease: motionTokens.easing }}
          className={cn("fixed inset-x-0 top-0 z-[60] pointer-events-none", className)}
        >
          {/* Soft blur veil at top */}
          <div className="h-14 bg-[linear-gradient(180deg,rgba(246,243,238,0.92),rgba(246,243,238,0))] backdrop-blur-sm" />

          {/* Premium top progress bar */}
          <div className="absolute left-0 top-0 h-[3px] w-full overflow-hidden">
            <div className="absolute inset-0 bg-border-subtle/60" />
            <motion.div
              className="absolute left-0 top-0 h-full w-1/2 bg-[linear-gradient(90deg,rgba(15,118,110,0),rgba(15,118,110,0.95),rgba(15,118,110,0))]"
              animate={{ x: ["-60%", "220%"] }}
              transition={{ duration: 1.05, ease: "easeInOut", repeat: Infinity }}
              style={{ filter: "drop-shadow(0 8px 18px rgba(15,118,110,0.24))" }}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

