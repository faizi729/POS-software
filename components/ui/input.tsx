import * as React from "react";

import { cn } from "@/lib/utils/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/10",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
