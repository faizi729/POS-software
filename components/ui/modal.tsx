import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { motionTokens } from "@/lib/motion";

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
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionTokens.durations.normal, ease: motionTokens.easing }}
        >
          <div
            className="absolute inset-0 bg-[rgba(28,26,23,0.32)] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-[20px] border border-border-subtle bg-bg-elevated shadow-[0_24px_80px_rgba(28,26,23,0.18)]",
              className
            )}
            initial={{ opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{ duration: motionTokens.durations.slow, ease: motionTokens.easing }}
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
            <div className="min-h-0 overflow-y-auto px-6 py-5">{children}</div>
            {footer ? (
              <div className="flex items-center justify-end gap-3 border-t border-border-subtle bg-bg-surface px-6 py-4">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
