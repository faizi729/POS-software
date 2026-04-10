"use client";

import { useToastStore, type ToastAction, type ToastVariant } from "@/store/toast-store";

type ToastArgs = {
  title: string;
  message?: string;
  durationMs?: number;
  action?: ToastAction;
  variant?: ToastVariant;
};

export const toast = {
  show(args: ToastArgs) {
    return useToastStore.getState().push(args);
  },
  success(title: string, opts?: Omit<ToastArgs, "title" | "variant">) {
    return useToastStore.getState().push({ variant: "success", title, ...opts });
  },
  error(title: string, opts?: Omit<ToastArgs, "title" | "variant">) {
    return useToastStore.getState().push({ variant: "error", title, ...opts });
  },
  info(title: string, opts?: Omit<ToastArgs, "title" | "variant">) {
    return useToastStore.getState().push({ variant: "info", title, ...opts });
  }
};

