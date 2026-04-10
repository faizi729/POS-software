"use client";

import { useEffect, useMemo } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

type AnimatedNumberProps = {
  value: number;
  format?: (n: number) => string;
  durationMs?: number;
  className?: string;
};

export function AnimatedNumber({
  value,
  format,
  durationMs = 160,
  className
}: AnimatedNumberProps) {
  const mv = useMotionValue(value);

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: Math.max(0.08, durationMs / 1000),
      ease: "easeOut"
    });
    return () => controls.stop();
  }, [mv, value, durationMs]);

  const formatter = useMemo(() => format ?? ((n: number) => String(Math.round(n))), [format]);

  const text = useTransform(mv, (latest) => {
    const safe = Number.isFinite(latest) ? latest : 0;
    return formatter(safe);
  });

  return <motion.span className={className}>{text}</motion.span>;
}

