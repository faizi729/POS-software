/**
 * WhatsApp cart engine.
 * Pure functions that operate on the session cart shape.
 * The caller (state machine) is responsible for persisting via updateSession.
 */

import type { CartItem } from "./wa-session-service";

export type Cart = {
  items: CartItem[];
  total: number;
};

function recalcTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.lineTotal, 0);
}

/**
 * Add item to cart (or increase quantity if same item exists).
 */
export function addToCart(
  cart: Cart,
  item: { menuItemId: string; name: string; price: number },
  qty = 1
): Cart {
  const existing = cart.items.find((i) => i.menuItemId === item.menuItemId);

  let items: CartItem[];

  if (existing) {
    items = cart.items.map((i) =>
      i.menuItemId === item.menuItemId
        ? { ...i, qty: i.qty + qty, lineTotal: (i.qty + qty) * i.price }
        : i
    );
  } else {
    items = [
      ...cart.items,
      {
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        qty,
        lineTotal: item.price * qty,
      },
    ];
  }

  return { items, total: recalcTotal(items) };
}

/**
 * Update quantity for a specific item. If qty <= 0, removes it.
 */
export function updateCartItemQty(
  cart: Cart,
  menuItemId: string,
  newQty: number
): Cart {
  let items: CartItem[];

  if (newQty <= 0) {
    items = cart.items.filter((i) => i.menuItemId !== menuItemId);
  } else {
    items = cart.items.map((i) =>
      i.menuItemId === menuItemId
        ? { ...i, qty: newQty, lineTotal: newQty * i.price }
        : i
    );
  }

  return { items, total: recalcTotal(items) };
}

/**
 * Remove item from cart entirely.
 */
export function removeFromCart(cart: Cart, menuItemId: string): Cart {
  const items = cart.items.filter((i) => i.menuItemId !== menuItemId);
  return { items, total: recalcTotal(items) };
}

/**
 * Clear the entire cart.
 */
export function clearCart(): Cart {
  return { items: [], total: 0 };
}

/**
 * Format cart for display in a WhatsApp message.
 */
export function formatCartMessage(cart: Cart, currency = "₹"): string {
  if (cart.items.length === 0) {
    return "Your cart is empty.";
  }

  const lines = cart.items.map(
    (i, idx) => `${idx + 1}. ${i.name} × ${i.qty} — ${currency}${i.lineTotal}`
  );

  lines.push("");
  lines.push(`*Total: ${currency}${cart.total}*`);

  return lines.join("\n");
}
