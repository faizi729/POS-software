import * as React from "react";

import { cn } from "@/lib/utils/cn";

const buttonVariants = {
  primary:
    "bg-accent-primary text-white shadow-[0_10px_26px_rgba(15,118,110,0.22)] hover:bg-accent-primary-hover hover:shadow-[0_14px_36px_rgba(15,118,110,0.28)] active:translate-y-px active:scale-[0.97] active:shadow-[0_8px_18px_rgba(15,118,110,0.20)]",
  secondary:
    "border border-border-subtle bg-bg-surface text-text-primary shadow-[0_10px_26px_rgba(28,26,23,0.06)] hover:border-border-strong hover:bg-white hover:shadow-[0_14px_34px_rgba(28,26,23,0.10)] active:translate-y-px active:scale-[0.97] active:shadow-[0_8px_18px_rgba(28,26,23,0.08)]",
  ghost:
    "bg-transparent text-text-secondary hover:bg-bg-surface hover:text-text-primary active:translate-y-px active:scale-[0.97]"
};

const buttonSizes = {
  default: "h-10 px-4",
  sm: "h-9 px-3",
  lg: "h-12 px-5",
  icon: "h-9 w-9"
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex cursor-pointer select-none items-center justify-center rounded-xl text-sm font-semibold outline-none transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out will-change-transform focus-visible:ring-4 focus-visible:ring-accent-primary/14 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
