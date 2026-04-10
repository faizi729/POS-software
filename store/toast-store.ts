"use client";

import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastItem = {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  durationMs: number;
  action?: ToastAction;
  createdAt: number;
};

type ToastInput = {
  variant?: ToastVariant;
  title: string;
  message?: string;
  durationMs?: number;
  action?: ToastAction;
};

type ToastState = {
  items: ToastItem[];
  push: (input: ToastInput) => string;
  remove: (id: string) => void;
  clear: () => void;
};

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  push: (input) => {
    const id = uid();
    const durationMs = Math.min(4000, Math.max(2000, input.durationMs ?? 2800));
    const item: ToastItem = {
      id,
      variant: input.variant ?? "info",
      title: input.title,
      message: input.message,
      durationMs,
      action: input.action,
      createdAt: Date.now()
    };

    set((state) => ({ items: [item, ...state.items].slice(0, 4) }));

    // Auto-dismiss timer
    window.setTimeout(() => {
      const stillThere = get().items.some((t) => t.id === id);
      if (stillThere) get().remove(id);
    }, durationMs);

    return id;
  },
  remove: (id) => set((state) => ({ items: state.items.filter((t) => t.id !== id) })),
  clear: () => set({ items: [] })
}));

