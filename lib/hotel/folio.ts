import type { ClientSession } from "mongoose";

import { roundPaise, sumPaise, type Paise } from "@/lib/hotel/money";
import { nextInvoiceNumber } from "@/lib/hotel/invoice";
import { nightTax, normalizeSlabs, type GstSlab } from "@/lib/hotel/tax";
import { Folio, FolioCharge, HotelPayment, Reservation, RoomNight } from "@/models";

const DAY_KEY = (date: Date | string) => new Date(date).toISOString().slice(0, 10);
const sessionOptions = (session?: ClientSession | null) => (session ? { session } : {});

/** One folio per reservation. Upsert survives concurrent check-ins. */
export async function ensureFolio(
  restaurantId: string,
  reservationId: string,
  session?: ClientSession | null
) {
  try {
    const folio = await Folio.findOneAndUpdate(
      { restaurantId, reservationId },
      { $setOnInsert: { restaurantId, reservationId, status: "open" } },
      { new: true, upsert: true, setDefaultsOnInsert: true, ...sessionOptions(session) }
    ).lean();
    if (folio) return folio;
  } catch (error) {
    const duplicate = typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
    if (!duplicate) throw error;
  }

  const existing = await Folio.findOne({ restaurantId, reservationId })
    .session(session ?? null)
    .lean();
  if (!existing) throw new Error("Could not open a folio for this reservation");
  return existing;
}

/**
 * Posts one `room` charge per night from the RoomNight inventory (each night
 * carries its own tariff), with GST computed from that night's slab.
 * Idempotent by stay date — re-running never double-bills.
 */
export async function postRoomNights(params: {
  restaurantId: string;
  reservationId: string;
  slabs?: GstSlab[] | null;
  session?: ClientSession | null;
}): Promise<{ posted: number; taxPaise: Paise }> {
  const folio = await ensureFolio(params.restaurantId, params.reservationId, params.session);

  // Group bookings with one bill: pull every room whose charges belong to this folio.
  const owner = await Reservation.findById(params.reservationId).select("folioReservationId").lean();
  const folioOwnerId = owner?.folioReservationId ? String(owner.folioReservationId) : params.reservationId;
  const groupMembers = await Reservation.find({
    restaurantId: params.restaurantId,
    $or: [{ _id: folioOwnerId }, { folioReservationId: folioOwnerId }]
  })
    .select("_id")
    .session(params.session ?? null)
    .lean();

  const nights = await RoomNight.find({
    restaurantId: params.restaurantId,
    reservationId: { $in: groupMembers.length ? groupMembers.map((row) => row._id) : [params.reservationId] }
  })
    .sort({ date: 1 })
    .session(params.session ?? null)
    .lean();

  if (!nights.length) return { posted: 0, taxPaise: 0 };

  const existing = await FolioCharge.find({
    restaurantId: params.restaurantId,
    folioId: folio._id,
    type: "room"
  })
    .select("nightKey stayDate")
    .session(params.session ?? null)
    .lean();

  const posted = new Set(
    existing.map((charge) => charge.nightKey || (charge.stayDate ? `${params.reservationId}:${DAY_KEY(charge.stayDate)}` : ""))
  );
  const slabs = normalizeSlabs(params.slabs);

  let taxPaise = 0;
  const docs = [];
  for (const night of nights) {
    const key = `${String(night.reservationId)}:${DAY_KEY(night.date)}`;
    if (posted.has(key)) continue;
    const tax = nightTax(night.ratePaise, slabs);
    taxPaise += tax.taxPaise;
    docs.push({
      restaurantId: params.restaurantId,
      folioId: folio._id,
      reservationId: folioOwnerId,
      type: "room",
      amountPaise: roundPaise(night.ratePaise),
      taxPaise: tax.taxPaise,
      taxPercent: tax.percent,
      description: `Room ${DAY_KEY(night.date)}`,
      stayDate: night.date,
      nightKey: key,
      postedAt: new Date()
    });
  }

  if (docs.length) {
    await FolioCharge.insertMany(docs, { ordered: true, ...sessionOptions(params.session) });
  }

  return { posted: docs.length, taxPaise: roundPaise(taxPaise) };
}

/** F&B / extras charge (already taxed by the POS where applicable). */
export async function postFolioCharge(params: {
  restaurantId: string;
  reservationId: string;
  type: "fnb" | "extra";
  amountPaise: Paise;
  taxPercent?: number;
  taxPaise?: Paise;
  description?: string;
  orderId?: string;
  postedBy?: string;
  session?: ClientSession | null;
}) {
  const folio = await ensureFolio(params.restaurantId, params.reservationId, params.session);
  const [charge] = await FolioCharge.create(
    [
      {
        restaurantId: params.restaurantId,
        folioId: folio._id,
        reservationId: params.reservationId,
        type: params.type,
        amountPaise: roundPaise(params.amountPaise),
        taxPercent: params.taxPercent ?? 0,
        taxPaise: roundPaise(params.taxPaise ?? 0),
        description: params.description,
        orderId: params.orderId,
        postedBy: params.postedBy,
        postedAt: new Date()
      }
    ],
    params.session ? { session: params.session } : undefined
  );
  return charge.toObject();
}

export type FolioTotals = {
  roomPaise: Paise;
  fnbPaise: Paise;
  extraPaise: Paise;
  chargesPaise: Paise;
  taxPaise: Paise;
  totalPaise: Paise;
};

export function folioTotals(
  charges: Array<{ type: string; amountPaise?: number | null; taxPaise?: number | null }>
): FolioTotals {
  const byType = { room: 0, fnb: 0, extra: 0 };
  let tax = 0;
  for (const charge of charges) {
    const amount = Number(charge.amountPaise) || 0;
    if (charge.type === "room") byType.room += amount;
    else if (charge.type === "fnb") byType.fnb += amount;
    else if (charge.type === "extra") byType.extra += amount;
    tax += Number(charge.taxPaise) || 0;
  }
  const chargesPaise = sumPaise([byType.room, byType.fnb, byType.extra]);
  return {
    roomPaise: roundPaise(byType.room),
    fnbPaise: roundPaise(byType.fnb),
    extraPaise: roundPaise(byType.extra),
    chargesPaise,
    taxPaise: roundPaise(tax),
    totalPaise: roundPaise(chargesPaise + tax)
  };
}

export type PaymentMethod = "cash" | "card" | "upi" | "wallet" | "bank" | "razorpay";
export type PaymentType = "advance" | "payment" | "refund";

/**
 * Writes a ledger row. `idempotencyKey` (provider event id) makes retries safe:
 * a repeat returns the existing row instead of double-crediting.
 */
export async function recordPayment(params: {
  restaurantId: string;
  reservationId?: string;
  bookingId?: string;
  amountPaise: Paise;
  method: PaymentMethod;
  type: PaymentType;
  reference?: string;
  notes?: string;
  idempotencyKey?: string;
  createdBy?: string;
  session?: ClientSession | null;
}) {
  if (!(params.amountPaise > 0)) throw new Error("Payment amount must be positive");

  if (params.idempotencyKey) {
    const existing = await HotelPayment.findOne({
      restaurantId: params.restaurantId,
      idempotencyKey: params.idempotencyKey
    })
      .session(params.session ?? null)
      .lean();
    if (existing) return existing;
  }

  try {
    const [created] = await HotelPayment.create(
      [
        {
          restaurantId: params.restaurantId,
          reservationId: params.reservationId,
          bookingId: params.bookingId,
          amountPaise: roundPaise(params.amountPaise),
          method: params.method,
          type: params.type,
          reference: params.reference,
          notes: params.notes,
          idempotencyKey: params.idempotencyKey,
          createdBy: params.createdBy,
          paidAt: new Date()
        }
      ],
      params.session ? { session: params.session } : undefined
    );
    return created.toObject();
  } catch (error) {
    const duplicate = typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
    if (duplicate && params.idempotencyKey) {
      const existing = await HotelPayment.findOne({
        restaurantId: params.restaurantId,
        idempotencyKey: params.idempotencyKey
      }).lean();
      if (existing) return existing;
    }
    throw error;
  }
}

/** Net collected (advance + payments − refunds), in paise. */
export async function paidPaiseFor(
  restaurantId: string,
  reservationId: string,
  session?: ClientSession | null
): Promise<Paise> {
  const payments = await HotelPayment.find({ restaurantId, reservationId })
    .select("type amountPaise")
    .session(session ?? null)
    .lean();

  return roundPaise(
    payments.reduce(
      (total, payment) =>
        total + (payment.type === "refund" ? -(payment.amountPaise ?? 0) : payment.amountPaise ?? 0),
      0
    )
  );
}

/** Net collected for a banquet booking (advance + payments − refunds). */
export async function paidPaiseForBooking(
  restaurantId: string,
  bookingId: string,
  session?: ClientSession | null
): Promise<Paise> {
  const payments = await HotelPayment.find({ restaurantId, bookingId })
    .select("type amountPaise")
    .session(session ?? null)
    .lean();

  return roundPaise(
    payments.reduce(
      (total, payment) =>
        total + (payment.type === "refund" ? -(payment.amountPaise ?? 0) : payment.amountPaise ?? 0),
      0
    )
  );
}

/** balance = charges − collected (negative when the guest overpaid). */
export function balancePaise(totalPaise: Paise, paidPaise: Paise): Paise {
  return roundPaise(totalPaise - paidPaise);
}

/** Issues the invoice number once, inside the checkout transaction. */
export async function issueInvoice(params: {
  restaurantId: string;
  reservationId: string;
  prefix?: string;
  date?: Date;
  session?: ClientSession | null;
}): Promise<string> {
  const folio = await ensureFolio(params.restaurantId, params.reservationId, params.session);
  if (folio.invoiceNumber) return folio.invoiceNumber;

  const { invoiceNumber } = await nextInvoiceNumber({
    restaurantId: params.restaurantId,
    scope: "hotel",
    prefix: params.prefix,
    date: params.date,
    session: params.session
  });

  await Folio.updateOne(
    { _id: folio._id, restaurantId: params.restaurantId },
    { $set: { invoiceNumber, invoiceIssuedAt: new Date() } },
    sessionOptions(params.session)
  );

  return invoiceNumber;
}

export async function settleFolio(
  restaurantId: string,
  reservationId: string,
  session?: ClientSession | null
) {
  await Folio.updateOne(
    { restaurantId, reservationId },
    { $set: { status: "settled", settledAt: new Date() } },
    sessionOptions(session)
  );
}

/** Active in-house reservation for a room (used by POS "Charge to room"). */
export async function activeReservationForRoom(restaurantId: string, roomId: string) {
  return Reservation.findOne({ restaurantId, roomId, status: "checked_in" }).lean();
}
