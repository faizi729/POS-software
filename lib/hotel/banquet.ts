import { roundPaise, sumPaise, toRupees } from "@/lib/hotel/money";
import { paidPaiseForBooking } from "@/lib/hotel/folio";
import type { BanquetDocumentInput } from "@/lib/hotel/banquet-html";
import { BanquetBooking, Hall, Restaurant } from "@/models";

/**
 * Banquet pricing: hall + per-plate × guests + add-ons, then GST.
 * Service GST is configurable per tenant/booking — verify against current law.
 */
export type BanquetAddOn = { name: string; amountPaise: number };

export function priceBanquet(params: {
  hallRatePaise: number;
  perPlatePaise: number;
  guestCount: number;
  addOns?: BanquetAddOn[];
  gstPercent: number;
}) {
  const plates = roundPaise(Math.max(0, params.perPlatePaise) * Math.max(0, params.guestCount));
  const addOns = sumPaise((params.addOns ?? []).map((row) => row.amountPaise));
  const subtotalPaise = sumPaise([params.hallRatePaise, plates, addOns]);
  const gstPaise = roundPaise((subtotalPaise * Math.max(0, params.gstPercent)) / 100);
  const totalPaise = sumPaise([subtotalPaise, gstPaise]);

  return { platesPaise: plates, addOnsPaise: addOns, subtotalPaise, gstPaise, totalPaise };
}

/** Cancellation for events: free until X hours, then a % of the total. */
export function banquetCancellation(input: {
  policy: { freeUntilHours: number; chargePercent: number };
  totalPaise: number;
  paidPaise: number;
  hoursToEvent: number;
}) {
  const free = input.hoursToEvent >= Math.max(0, input.policy.freeUntilHours);
  const penalty = free
    ? 0
    : Math.min(input.totalPaise, roundPaise((input.totalPaise * Math.max(0, input.policy.chargePercent)) / 100));
  return {
    penaltyPaise: penalty,
    refundablePaise: Math.max(0, Math.min(roundPaise(input.paidPaise), roundPaise(input.paidPaise - penalty))),
    isFree: free
  };
}

/** Loads everything a quotation / invoice / run sheet needs, in rupees. */
export async function loadBanquetDocument(params: {
  restaurantId: string;
  bookingId: string;
  kind: BanquetDocumentInput["kind"];
  documentNumber?: string | null;
}): Promise<BanquetDocumentInput | null> {
  const booking = await BanquetBooking.findOne({
    _id: params.bookingId,
    restaurantId: params.restaurantId
  }).lean();
  if (!booking) return null;

  const [hall, restaurant, paid] = await Promise.all([
    Hall.findById(booking.hallId).select("name").lean(),
    Restaurant.findById(params.restaurantId).select("name").lean(),
    paidPaiseForBooking(params.restaurantId, params.bookingId)
  ]);

  const totalPaise = booking.totalAmountPaise ?? 0;

  return {
    kind: params.kind,
    restaurantName: restaurant?.name ?? "Hotel",
    hallName: hall?.name ?? "Hall",
    date: new Date(booking.date).toISOString().slice(0, 10),
    slot: booking.slot,
    eventType: booking.eventType ?? "",
    guestName: booking.guestName ?? "",
    guestCount: booking.guestCount,
    hallRate: toRupees(booking.hallRatePaise ?? 0),
    perPlate: toRupees(booking.menuPackage?.perPlatePaise ?? 0),
    items: (booking.menuPackage?.items ?? []).map((item) => ({
      name: item.nameSnapshot,
      pricePerPlate: toRupees(item.pricePerPlatePaise ?? 0)
    })),
    addOns: (booking.addOns ?? []).map((row) => ({ name: row.name, amount: toRupees(row.amountPaise) })),
    gstPercent: booking.gstPercent ?? 0,
    gst: toRupees(booking.gstPaise ?? 0),
    total: toRupees(totalPaise),
    paid: toRupees(paid),
    balance: toRupees(Math.max(0, totalPaise - paid)),
    documentNumber: params.documentNumber ?? booking.invoiceNumber ?? undefined,
    setupType: booking.setupType ?? "",
    startTime: booking.startTime ?? "",
    endTime: booking.endTime ?? "",
    staffNotes: booking.staffNotes ?? booking.notes ?? ""
  };
}
