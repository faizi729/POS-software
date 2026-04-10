import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-xl border border-border-subtle bg-[linear-gradient(110deg,rgba(231,225,216,0.35),rgba(255,255,255,0.9),rgba(231,225,216,0.35))] bg-[length:200%_100%]",
        className
      )}
    />
  );
}

