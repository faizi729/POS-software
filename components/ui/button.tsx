import * as React from "react";

import { cn } from "@/lib/utils/cn";

const buttonVariants = {
  primary:
    "bg-accent-primary text-white hover:bg-accent-primary-hover active:scale-[0.99]",
  secondary:
    "border border-border-subtle bg-bg-surface text-text-primary hover:border-border-strong hover:bg-white active:scale-[0.99]",
  ghost:
    "bg-transparent text-text-secondary hover:bg-bg-surface hover:text-text-primary active:scale-[0.99]"
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
          "inline-flex cursor-pointer items-center justify-center rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/25 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50",
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
