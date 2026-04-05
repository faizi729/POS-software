/**
 * Simple in-process event bus for module communication.
 * Modules can subscribe to events without tight coupling.
 *
 * Usage:
 *   eventBus.on("order:placed", async (data) => { ... });
 *   eventBus.emit("order:placed", { orderId, restaurantId });
 */

type EventHandler = (data: any) => void | Promise<void>;

class EventBus {
  private handlers = new Map<string, EventHandler[]>();

  on(event: string, handler: EventHandler) {
    const existing = this.handlers.get(event) ?? [];
    existing.push(handler);
    this.handlers.set(event, existing);
    return () => {
      const list = this.handlers.get(event) ?? [];
      this.handlers.set(
        event,
        list.filter((h) => h !== handler)
      );
    };
  }

  async emit(event: string, data: any) {
    const handlers = this.handlers.get(event) ?? [];
    for (const handler of handlers) {
      try {
        await handler(data);
      } catch (error) {
        console.error(`[EventBus] Error in handler for "${event}":`, error);
      }
    }
  }

  off(event: string) {
    this.handlers.delete(event);
  }
}

// Singleton — persists across hot reloads in dev
declare global {
  var __eventBus: EventBus | undefined;
}

export const eventBus = global.__eventBus ?? new EventBus();

if (process.env.NODE_ENV !== "production") {
  global.__eventBus = eventBus;
}

/* ──────── Event type definitions ──────── */

export type OrderPlacedEvent = {
  orderId: string;
  restaurantId: string;
  items: Array<{ menuItemId: string; quantity: number }>;
  customer?: { name?: string; phone?: string };
};

export type OrderStatusChangedEvent = {
  orderId: string;
  restaurantId: string;
  previousStatus: string;
  newStatus: string;
};

export type PaymentCompletedEvent = {
  orderId: string;
  restaurantId: string;
  amount: number;
  customerId?: string;
};

export type InventoryLowEvent = {
  restaurantId: string;
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  reorderLevel: number;
};
