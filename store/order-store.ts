"use client";

import { create } from "zustand";

type CartItem = {
  key: string;
  menuItemId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
};

type OrderStore = {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  taxMode: "inclusive" | "exclusive";
  gstEnabled: boolean;
  gstRatePercent: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  incrementItem: (key: string) => void;
  decrementItem: (key: string) => void;
  reset: () => void;
  setTaxConfig: (config: { taxMode: "inclusive" | "exclusive"; gstEnabled: boolean; gstRatePercent: number }) => void;
};

function deriveTotals(params: {
  items: CartItem[];
  taxMode: "inclusive" | "exclusive";
  gstEnabled: boolean;
  gstRatePercent: number;
}) {
  const subtotal = params.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const rate = params.gstEnabled ? Math.max(0, params.gstRatePercent) / 100 : 0;
  const tax =
    rate <= 0
      ? 0
      : params.taxMode === "inclusive"
        ? Number((subtotal - subtotal / (1 + rate)).toFixed(2))
        : Number((subtotal * rate).toFixed(2));
  const total =
    params.taxMode === "inclusive"
      ? Number(subtotal.toFixed(2))
      : Number((subtotal + tax).toFixed(2));

  return { subtotal, tax, total };
}

export const useOrderStore = create<OrderStore>((set) => ({
  items: [],
  taxMode: "exclusive",
  gstEnabled: true,
  gstRatePercent: 5,
  ...deriveTotals({ items: [], taxMode: "exclusive", gstEnabled: true, gstRatePercent: 5 }),
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((entry) => entry.key === item.key);
      const items = existing
        ? state.items.map((entry) =>
            entry.key === item.key ? { ...entry, quantity: entry.quantity + 1 } : entry
          )
        : [...state.items, { ...item, quantity: 1 }];

      return { items, ...deriveTotals({ items, taxMode: state.taxMode, gstEnabled: state.gstEnabled, gstRatePercent: state.gstRatePercent }) };
    }),
  incrementItem: (key) =>
    set((state) => {
      const items = state.items.map((item) =>
        item.key === key ? { ...item, quantity: item.quantity + 1 } : item
      );

      return { items, ...deriveTotals({ items, taxMode: state.taxMode, gstEnabled: state.gstEnabled, gstRatePercent: state.gstRatePercent }) };
    }),
  decrementItem: (key) =>
    set((state) => {
      const items = state.items
        .map((item) => (item.key === key ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0);

      return { items, ...deriveTotals({ items, taxMode: state.taxMode, gstEnabled: state.gstEnabled, gstRatePercent: state.gstRatePercent }) };
    }),
  reset: () =>
    set((state) => ({
      items: [],
      ...deriveTotals({ items: [], taxMode: state.taxMode, gstEnabled: state.gstEnabled, gstRatePercent: state.gstRatePercent })
    })),
  setTaxConfig: (config) =>
    set((state) => {
      const next = { ...state, ...config };
      return {
        taxMode: next.taxMode,
        gstEnabled: next.gstEnabled,
        gstRatePercent: next.gstRatePercent,
        ...deriveTotals({ items: state.items, taxMode: next.taxMode, gstEnabled: next.gstEnabled, gstRatePercent: next.gstRatePercent })
      };
    })
}));
