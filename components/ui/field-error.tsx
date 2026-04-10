import { cn } from "@/lib/utils/cn";

export function FieldError({ message, className }: { message?: string | null; className?: string }) {
  if (!message) return null;
  return (
    <p className={cn("text-sm font-medium text-rose-700", className)} role="alert">
      {message}
    </p>
  );
}

