"use client";

import React, { useRef, useState, useMemo, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import type { StreetSectionProps, BuilderOption } from "@/types/street-template";

/* ══════════════════════════════════════════════════════════════════════════════
   BuildYourOwn — Interactive step-by-step food builder
   ════════════════════════════════════════════════════════════════════════════ */
export default function BuildYourOwn({
  restaurantData,
  theme,
  onAddBuilderItem,
}: StreetSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  const steps = restaurantData.builderSteps;
  if (!steps || steps.length === 0) return null;

  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, BuilderOption[]>>({});
  const [added, setAdded] = useState(false);

  const step = steps[currentStep];

  /* Toggle selection for current step */
  const toggleOption = useCallback(
    (opt: BuilderOption) => {
      setSelections((prev) => {
        const stepId = step.id;
        const current = prev[stepId] ?? [];
        if (step.multi) {
          const exists = current.find((o) => o.id === opt.id);
          return {
            ...prev,
            [stepId]: exists
              ? current.filter((o) => o.id !== opt.id)
              : [...current, opt],
          };
        }
        return { ...prev, [stepId]: [opt] };
      });
    },
    [step]
  );

  const isSelected = (optId: string) =>
    (selections[step.id] ?? []).some((o) => o.id === optId);

  /* Total price */
  const totalPrice = useMemo(() => {
    return Object.values(selections)
      .flat()
      .reduce((sum, opt) => sum + opt.price, 0);
  }, [selections]);

  /* All steps have at least one selection? */
  const allStepsComplete = steps.every(
    (s) => (selections[s.id] ?? []).length > 0
  );

  /* Summary label */
  const summaryLabel = useMemo(() => {
    return steps
      .map((s) => (selections[s.id] ?? []).map((o) => o.name).join(" + "))
      .filter(Boolean)
      .join(" · ");
  }, [steps, selections]);

  /* Add to cart */
  const handleAddToCart = () => {
    if (!allStepsComplete) return;
    onAddBuilderItem({
      id: `custom-${Date.now()}`,
      name: `Custom Build: ${summaryLabel}`,
      price: totalPrice,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-16 md:py-24"
      style={{ backgroundColor: theme.background }}
    >
      {/* Accent top border */}
      <div
        className="absolute left-0 top-0 h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent}, ${theme.primary})`,
        }}
      />

      <motion.div
        className="mx-auto max-w-4xl px-6 md:px-12"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        {/* Heading */}
        <div className="mb-10 text-center">
          <p
            className="mb-2 text-xs font-bold uppercase tracking-[0.3em]"
            style={{ color: theme.accent }}
          >
            Your Rules
          </p>
          <h2
            className="text-3xl font-black uppercase tracking-tight md:text-5xl"
            style={{ color: theme.text }}
          >
            Build Your Own
          </h2>
        </div>

        {/* ── Step progress bar ────────────────────────────────────────── */}
        <div className="mb-10 flex items-center justify-center gap-2">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              className="flex items-center gap-2"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200"
                style={{
                  backgroundColor:
                    idx === currentStep
                      ? theme.primary
                      : (selections[s.id] ?? []).length > 0
                        ? `${theme.primary}44`
                        : `${theme.text}15`,
                  color:
                    idx === currentStep
                      ? theme.background
                      : (selections[s.id] ?? []).length > 0
                        ? theme.primary
                        : `${theme.text}55`,
                }}
              >
                {(selections[s.id] ?? []).length > 0 && idx !== currentStep
                  ? "✓"
                  : idx + 1}
              </div>
              <span
                className="hidden text-xs font-bold uppercase tracking-wider md:inline"
                style={{
                  color:
                    idx === currentStep ? theme.primary : `${theme.text}55`,
                }}
              >
                {s.label}
              </span>
              {idx < steps.length - 1 && (
                <div
                  className="mx-1 hidden h-px w-8 md:block"
                  style={{ backgroundColor: `${theme.text}20` }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ── Step label (mobile) ──────────────────────────────────────── */}
        <p
          className="mb-6 text-center text-sm font-bold uppercase tracking-[0.15em] md:hidden"
          style={{ color: theme.primary }}
        >
          Step {currentStep + 1}: {step.label}
          {step.multi && (
            <span style={{ color: `${theme.text}55` }}> (pick multiple)</span>
          )}
        </p>

        {/* ── Options grid ─────────────────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {step.options.map((opt) => {
            const sel = isSelected(opt.id);
            return (
              <motion.button
                key={opt.id}
                onClick={() => toggleOption(opt)}
                className="relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200"
                style={{
                  backgroundColor: sel ? `${theme.primary}15` : `${theme.text}06`,
                  border: `2px solid ${sel ? theme.primary : `${theme.text}12`}`,
                }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Check */}
                {sel && (
                  <span
                    className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor: theme.primary,
                      color: theme.background,
                    }}
                  >
                    ✓
                  </span>
                )}

                {/* Option image */}
                {opt.image && (
                  <img
                    src={opt.image}
                    alt={opt.name}
                    className="mb-3 h-16 w-16 rounded-lg object-cover"
                    loading="lazy"
                  />
                )}

                <p
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: theme.text }}
                >
                  {opt.name}
                </p>
                <p
                  className="mt-1 text-xs font-extrabold"
                  style={{ color: theme.primary }}
                >
                  +{step.options[0].price === 0 && opt.price === 0 ? "FREE" : `$${opt.price.toFixed(2)}`}
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* ── Navigation + Total ────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          {/* Back */}
          <button
            onClick={() => setCurrentStep((p) => Math.max(0, p - 1))}
            disabled={currentStep === 0}
            className="text-xs font-bold uppercase tracking-wider transition-opacity disabled:opacity-30"
            style={{ color: `${theme.text}88` }}
          >
            ← Back
          </button>

          {/* Total price */}
          <div className="text-center">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ color: `${theme.text}55` }}
            >
              Your Build
            </p>
            <p
              className="text-3xl font-black"
              style={{ color: theme.primary }}
            >
              ${totalPrice.toFixed(2)}
            </p>
          </div>

          {/* Next / Add to cart */}
          {currentStep < steps.length - 1 ? (
            <motion.button
              onClick={() =>
                setCurrentStep((p) => Math.min(steps.length - 1, p + 1))
              }
              disabled={(selections[step.id] ?? []).length === 0}
              className="rounded-full px-8 py-3 text-xs font-bold uppercase tracking-[0.15em] transition-opacity disabled:opacity-30"
              style={{
                backgroundColor: theme.primary,
                color: theme.background,
              }}
              whileTap={{ scale: 0.95 }}
            >
              Next Step →
            </motion.button>
          ) : (
            <motion.button
              onClick={handleAddToCart}
              disabled={!allStepsComplete}
              className="rounded-full px-8 py-3 text-xs font-bold uppercase tracking-[0.15em] transition-opacity disabled:opacity-30"
              style={{
                backgroundColor: added ? "#22c55e" : theme.accent,
                color: "#fff",
              }}
              whileTap={{ scale: 0.95 }}
            >
              {added ? "✓ Added!" : "Add to Order"}
            </motion.button>
          )}
        </div>
      </motion.div>
    </section>
  );
}
