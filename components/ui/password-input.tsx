"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">
>(({ className, disabled, ...props }, ref) => {
  const [show, setShow] = React.useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        type={show ? "text" : "password"}
        disabled={disabled}
        className={cn(
          "h-10 w-full rounded-xl border border-border-subtle bg-white px-4 pr-11 text-sm text-text-primary outline-none transition-[box-shadow,border-color,background-color] duration-200 ease-out placeholder:text-text-muted focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/12 disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        {...props}
      />
      <button
        type="button"
        disabled={disabled}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-text-muted transition hover:bg-bg-surface hover:text-text-primary disabled:pointer-events-none disabled:opacity-50"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";
