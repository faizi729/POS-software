import { z } from "zod";

import {
  ORDER_CHANNELS,
  ORDER_STATUSES,
  ORDER_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES
} from "@/lib/constants/roles";

export const orderItemSchema = z.object({
  menuItemId: z.string().min(1),
  nameSnapshot: z.string().min(1),
  priceSnapshot: z.number().min(0),
  quantity: z.number().int().positive(),
  notes: z.string().max(200).optional(),
  lineTotal: z.number().min(0)
});

export const orderSchema = z.object({
  restaurantId: z.string().min(1),
  orderNumber: z.string().min(1),
  channel: z.enum(ORDER_CHANNELS).default("pos"),
  type: z.enum(ORDER_TYPES).default("dine_in"),
  status: z.enum(ORDER_STATUSES).default("draft"),
  tableNo: z.string().max(20).optional(),
  customer: z
    .object({
      name: z.string().max(80).optional(),
      phone: z.string().max(30).optional()
    })
    .default({}),
  items: z.array(orderItemSchema).default([]),
  pricing: z.object({
    subtotal: z.number().min(0),
    tax: z.number().min(0),
    serviceCharge: z.number().min(0),
    discount: z.number().min(0),
    grandTotal: z.number().min(0)
  }),
  paymentStatus: z.enum(["unpaid", "partial", "paid", "refunded"]).default("unpaid"),
  createdBy: z.string().min(1)
});

export const paymentSchema = z.object({
  restaurantId: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().positive(),
  method: z.enum(PAYMENT_METHODS),
  status: z.enum(PAYMENT_STATUSES).default("completed"),
  reference: z.string().max(80).optional(),
  receivedBy: z.string().min(1)
});
