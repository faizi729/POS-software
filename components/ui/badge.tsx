import { cn } from "@/lib/utils/cn";

const badgeVariants = {
  neutral: "bg-bg-surface text-text-secondary",
  success: "bg-[rgba(21,128,61,0.12)] text-success",
  warning: "bg-[rgba(180,83,9,0.12)] text-warning",
  danger: "bg-[rgba(180,35,24,0.12)] text-danger"
};

export function Badge({
  className,
  variant = "neutral",
  children
}: {
  className?: string;
  variant?: keyof typeof badgeVariants;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full flex-wrap items-center justify-center gap-x-1 gap-y-0.5 whitespace-normal break-words rounded-full px-2.5 py-1 text-left text-xs font-semibold tracking-[0.01em]",
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
