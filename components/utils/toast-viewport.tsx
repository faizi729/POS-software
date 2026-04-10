"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { motionTokens } from "@/lib/motion";
import { useToastStore } from "@/store/toast-store";

function variantStyles(variant: "success" | "error" | "info") {
  switch (variant) {
    case "success":
      return {
        dot: "bg-emerald-500",
        ring: "ring-emerald-500/14",
        title: "text-text-primary"
      };
    case "error":
      return {
        dot: "bg-red-500",
        ring: "ring-red-500/14",
        title: "text-text-primary"
      };
    default:
      return {
        dot: "bg-accent-primary",
        ring: "ring-accent-primary/14",
        title: "text-text-primary"
      };
  }
}

export function ToastViewport() {
  const { items, remove } = useToastStore();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[70] w-[min(420px,calc(100vw-32px))] space-y-3">
      <AnimatePresence initial={false}>
        {items.map((t) => {
          const v = variantStyles(t.variant);
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: motionTokens.durations.normal, ease: motionTokens.easing }}
              className={cn(
                "pointer-events-auto overflow-hidden rounded-2xl border border-border-subtle bg-[rgba(255,253,249,0.82)] shadow-[0_24px_70px_rgba(28,26,23,0.16)] backdrop-blur supports-[backdrop-filter]:bg-[rgba(255,253,249,0.72)]",
                "ring-4",
                v.ring
              )}
            >
              <div className="flex items-start gap-3 p-4">
                <span className={cn("mt-1.5 size-2.5 rounded-full", v.dot)} />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-semibold", v.title)}>{t.title}</p>
                  {t.message ? <p className="mt-1 text-sm text-text-secondary">{t.message}</p> : null}
                  {t.action ? (
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          t.action?.onClick();
                        } finally {
                          remove(t.id);
                        }
                      }}
                      className="mt-3 inline-flex items-center rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm font-semibold text-text-primary shadow-soft transition hover:border-border-strong hover:bg-bg-surface active:translate-y-px active:scale-[0.99]"
                    >
                      {t.action.label}
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => remove(t.id)}
                  className="grid size-9 place-items-center rounded-xl text-text-secondary transition hover:bg-bg-surface hover:text-text-primary active:translate-y-px active:scale-[0.99]"
                >
                  <X className="size-4" />
                </button>
              </div>
              {/* tiny lifetime indicator */}
              <motion.div
                className="h-[2px] bg-border-subtle"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: t.durationMs / 1000, ease: motionTokens.easing }}
                style={{ transformOrigin: "left" }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

