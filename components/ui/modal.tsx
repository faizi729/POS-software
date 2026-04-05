import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type ModalProps = {
  open?: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  onClose?: () => void;
};

export function Modal({
  open = true,
  title,
  description,
  children,
  footer,
  className,
  onClose
}: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,26,23,0.32)] p-4 backdrop-blur-sm">
      <div
        className={cn(
          "w-full max-w-2xl overflow-hidden rounded-[20px] border border-border-subtle bg-bg-elevated shadow-[0_24px_80px_rgba(28,26,23,0.18)]",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-6 py-5">
          <div>
            <h3>{title}</h3>
            {description ? <p className="mt-1">{description}</p> : null}
          </div>
          <Button variant="ghost" size="icon" aria-label="Close modal" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-3 border-t border-border-subtle bg-bg-surface px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
