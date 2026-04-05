import { z } from "zod";

export const restaurantSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  timezone: z.string().min(2),
  currency: z.string().length(3),
  status: z.enum(["active", "suspended"]).default("active"),
  settings: z.object({
    taxMode: z.enum(["inclusive", "exclusive"]).default("exclusive"),
    serviceChargeEnabled: z.boolean().default(false),
    orderPrefix: z.string().min(1).max(10).default("POS"),
    defaultPaymentMethods: z.array(z.enum(["cash", "card", "upi", "wallet"])).default(["cash", "card"])
  }),
  contact: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().max(300).optional()
  })
});
