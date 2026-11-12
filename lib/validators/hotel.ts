import { z } from "zod";

import {
  BANQUET_STATUSES,
  BOOKING_SLOTS,
  HOUSEKEEPING_STATUSES,
  MEAL_PLANS,
  MAINTENANCE_STATUSES,
  RESERVATION_SOURCES,
  RESERVATION_STATUSES,
  ROOM_STATUSES
} from "@/lib/constants/roles";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const roomTypeSchema = z.object({
  name: z.string().min(1).max(60),
  baseRate: z.coerce.number().min(0),
  maxOccupancy: z.coerce.number().int().min(1).max(20).default(2),
  amenities: z.array(z.string().trim().max(40)).default([]),
  gstPercent: z.coerce.number().min(0).max(28).default(12)
});

export const roomSchema = z.object({
  number: z.string().min(1).max(12),
  floor: z.coerce.number().int().min(0).max(99).default(1),
  roomTypeId: objectId,
  status: z.enum(ROOM_STATUSES).default("available")
});

export const guestSchema = z.object({
  name: z.string().min(1).max(80),
  phone: z.string().min(3).max(20).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  idType: z.string().max(30).optional(),
  idNumber: z.string().max(40).optional()
});

export const reservationSchema = z
  .object({
    roomId: objectId,
    guest: guestSchema,
    checkIn: dateOnly,
    checkOut: dateOnly,
    status: z.enum(["tentative", "confirmed"]).default("confirmed"),
    source: z.enum(RESERVATION_SOURCES).default("walk_in"),
    advancePaid: z.coerce.number().min(0).default(0),
    holdExpiresAt: z.string().datetime().optional().or(z.literal("")),
    adults: z.coerce.number().int().min(1).max(20).default(2),
    children: z.coerce.number().int().min(0).max(20).default(0),
    discountCode: z.string().max(24).optional().or(z.literal("")),
    notes: z.string().max(500).optional()
  })
  .refine((value) => value.checkOut > value.checkIn, {
    message: "Check-out must be after check-in",
    path: ["checkOut"]
  });

export const reservationActionSchema = z.object({
  action: z.enum(["confirm", "cancel", "no_show", "check_in", "check_out"]),
  /** Manager override for checkout while the folio still has a balance. */
  override: z.boolean().optional()
});

/** Ledger payment (advance / settlement / refund). Amounts arrive in rupees. */
export const hotelPaymentSchema = z.object({
  reservationId: objectId.optional(),
  bookingId: objectId.optional(),
  amount: z.coerce.number().positive(),
  method: z.enum(["cash", "card", "upi", "wallet", "bank", "razorpay"]),
  type: z.enum(["advance", "payment", "refund"]).default("payment"),
  reference: z.string().max(80).optional(),
  notes: z.string().max(200).optional(),
  idempotencyKey: z.string().max(120).optional()
});

export const folioChargeSchema = z.object({
  type: z.enum(["fnb", "extra"]),
  amount: z.coerce.number().positive(),
  taxPercent: z.coerce.number().min(0).max(28).optional(),
  description: z.string().max(120).optional(),
  orderId: objectId.optional()
});

export const housekeepingSchema = z.object({
  roomId: objectId,
  assignee: z.string().max(60).optional(),
  note: z.string().max(200).optional()
});

export const housekeepingPatchSchema = z.object({
  status: z.enum(HOUSEKEEPING_STATUSES),
  assignee: z.string().max(60).optional()
});

export const hallSchema = z.object({
  name: z.string().min(1).max(60),
  capacity: z.coerce.number().int().min(1).max(5000),
  baseRate: z.coerce.number().min(0).default(0),
  setupTypes: z.array(z.string().trim().max(30)).default([])
});

export const banquetBookingSchema = z.object({
  hallId: objectId,
  date: dateOnly,
  slot: z.enum(BOOKING_SLOTS),
  eventType: z.string().max(60).optional(),
  guestName: z.string().max(80).optional(),
  guestPhone: z.string().max(20).optional(),
  guestCount: z.coerce.number().int().min(1).max(5000),
  perPlate: z.coerce.number().min(0).default(0),
  packageItems: z
    .array(
      z.object({
        menuItemId: objectId.optional(),
        nameSnapshot: z.string().min(1).max(80),
        pricePerPlate: z.coerce.number().min(0)
      })
    )
    .default([]),
  addOns: z
    .array(z.object({ name: z.string().min(1).max(60), amount: z.coerce.number().min(0) }))
    .default([]),
  gstPercent: z.coerce.number().min(0).max(28).default(18),
  setupType: z.string().max(40).optional(),
  startTime: z.string().max(10).optional(),
  endTime: z.string().max(10).optional(),
  staffNotes: z.string().max(400).optional(),
  status: z.enum(["tentative", "confirmed"]).default("confirmed"),
  advancePaid: z.coerce.number().min(0).default(0),
  holdExpiresAt: z.string().datetime().optional().or(z.literal("")),
  notes: z.string().max(500).optional()
});

export const banquetUpdateSchema = banquetBookingSchema.partial().extend({
  status: z.enum(BANQUET_STATUSES).optional()
});

export const banquetActionSchema = z.object({
  status: z.enum(BANQUET_STATUSES),
  reason: z.string().max(200).optional()
});


export const reservationStatusSchema = z.enum(RESERVATION_STATUSES);

/* ──── Step 2: front desk ──── */

export const reservationActionSchemaV2 = z.object({
  action: z.enum(["confirm", "cancel", "no_show", "check_in", "check_out", "move", "extend"]),
  /** Manager override for checkout while the folio still has a balance. */
  override: z.boolean().optional(),
  /** move target */
  roomId: objectId.optional(),
  /** extend target (new check-out) */
  checkOut: dateOnly.optional(),
  /** skip early check-in / late check-out fees */
  waiveFees: z.boolean().optional(),
  reason: z.string().max(200).optional()
});

export const reservationEditSchema = z.object({
  guest: guestSchema.partial().optional(),
  adults: z.coerce.number().int().min(1).max(20).optional(),
  children: z.coerce.number().int().min(0).max(20).optional(),
  notes: z.string().max(500).optional(),
  discountCode: z.string().max(24).optional().or(z.literal(""))
});

export const groupReservationSchema = z
  .object({
    rooms: z
      .array(
        z.object({
          roomId: objectId,
          adults: z.coerce.number().int().min(1).max(20).default(2),
          children: z.coerce.number().int().min(0).max(20).default(0)
        })
      )
      .min(1)
      .max(20),
    guest: guestSchema,
    checkIn: dateOnly,
    checkOut: dateOnly,
    status: z.enum(["tentative", "confirmed"]).default("confirmed"),
    source: z.enum(RESERVATION_SOURCES).default("walk_in"),
    /** single → one folio for the whole group, separate → one per room */
    folioMode: z.enum(["single", "separate"]).default("separate"),
    advancePaid: z.coerce.number().min(0).default(0),
    discountCode: z.string().max(24).optional().or(z.literal("")),
    holdExpiresAt: z.string().datetime().optional().or(z.literal("")),
    notes: z.string().max(500).optional()
  })
  .refine((value) => value.checkOut > value.checkIn, {
    message: "Check-out must be after check-in",
    path: ["checkOut"]
  });

/* ──── Step 3: rates + quote ──── */

export const quoteSchema = z
  .object({
    roomId: objectId.optional(),
    roomTypeId: objectId.optional(),
    checkIn: dateOnly,
    checkOut: dateOnly,
    adults: z.coerce.number().int().min(1).max(20).default(2),
    children: z.coerce.number().int().min(0).max(20).default(0),
    discountCode: z.string().max(24).optional().or(z.literal(""))
  })
  .refine((value) => value.checkOut > value.checkIn, {
    message: "Check-out must be after check-in",
    path: ["checkOut"]
  });

export const ratePlanSchema = z.object({
  name: z.string().min(1).max(60),
  roomTypeId: objectId.optional().or(z.literal("")),
  dateFrom: dateOnly.optional().or(z.literal("")),
  dateTo: dateOnly.optional().or(z.literal("")),
  weekdays: z.array(z.coerce.number().int().min(0).max(6)).default([]),
  baseRate: z.coerce.number().min(0),
  extraAdult: z.coerce.number().min(0).default(0),
  child: z.coerce.number().min(0).default(0),
  includedAdults: z.coerce.number().int().min(1).max(10).default(2),
  includedChildren: z.coerce.number().int().min(0).max(10).default(0),
  mealPlan: z.enum(MEAL_PLANS).default("EP"),
  mealPlanAmount: z.coerce.number().min(0).default(0),
  discountCode: z.string().max(24).optional().or(z.literal("")),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  minNights: z.coerce.number().int().min(1).max(365).default(1),
  priority: z.coerce.number().int().min(0).max(100).default(0),
  active: z.boolean().default(true)
});

/* ──── Step 7: maintenance + guest scan ──── */

export const maintenanceSchema = z.object({
  roomId: objectId,
  title: z.string().min(1).max(80),
  description: z.string().max(400).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium")
});

export const maintenancePatchSchema = z.object({
  status: z.enum(MAINTENANCE_STATUSES).optional(),
  assignee: z.string().max(60).optional(),
  resolution: z.string().max(300).optional()
});

/* ──── Step 4: public booking ──── */

export const publicQuoteSchema = z
  .object({
    roomTypeId: objectId.optional(),
    checkIn: dateOnly,
    checkOut: dateOnly,
    adults: z.coerce.number().int().min(1).max(12).default(2),
    children: z.coerce.number().int().min(0).max(8).default(0),
    discountCode: z.string().max(24).optional().or(z.literal(""))
  })
  .refine((value) => value.checkOut > value.checkIn, {
    message: "Check-out must be after check-in",
    path: ["checkOut"]
  });

export const publicBookingSchema = publicQuoteSchema.and(
  z.object({
    roomTypeId: objectId,
    guest: z.object({
      name: z.string().min(2).max(80),
      phone: z.string().min(6).max(20),
      email: z.string().email().optional().or(z.literal(""))
    })
  })
);

