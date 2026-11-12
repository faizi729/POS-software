import mongoose from "mongoose";

import { roundPaise } from "@/lib/hotel/money";
import { BanquetBooking, BusinessDate, FolioCharge, HotelPayment, Reservation, Room, RoomNight } from "@/models";

export type ReportRange = { from: Date; to: Date };

export type HotelReport = {
  from: string;
  to: string;
  days: number;
  rooms: number;
  occupancyPercent: number;
  adr: number;
  revpar: number;
  roomRevenue: number;
  fnbRevenue: number;
  extraRevenue: number;
  tax: number;
  banquetRevenue: number;
  collected: number;
  refunded: number;
  bySource: Array<{ source: string; reservations: number; revenue: number }>;
  byMethod: Array<{ method: string; collected: number; refunded: number }>;
  daily: Array<{ date: string; room: number; fnb: number; extra: number; tax: number; collected: number; occupied: number }>;
  arrivals: number;
  departures: number;
  noShows: number;
  cancellations: number;
  inHouse: number;
};

const DAY_MS = 86_400_000;
const dayKey = (date: Date) => new Date(date).toISOString().slice(0, 10);
const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

/** Occupancy / ADR / RevPAR + revenue splits + movement counts (all paise). */
export async function buildHotelReport(restaurantId: string, range: ReportRange): Promise<HotelReport> {
  const { from, to } = range;
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / DAY_MS));

  const [rooms, occupiedNights, chargeAgg, paymentAgg, banquetAgg] = await Promise.all([
    Room.countDocuments({ restaurantId }),
    RoomNight.countDocuments({ restaurantId, date: { $gte: from, $lt: to } }),
    FolioCharge.aggregate([
      { $match: { restaurantId: toObjectId(restaurantId), postedAt: { $gte: from, $lt: to } } },
      {
        $group: {
          _id: { type: "$type", day: { $dateToString: { format: "%Y-%m-%d", date: "$postedAt" } } },
          amountPaise: { $sum: "$amountPaise" },
          taxPaise: { $sum: "$taxPaise" }
        }
      }
    ]),
    HotelPayment.aggregate([
      { $match: { restaurantId: toObjectId(restaurantId), paidAt: { $gte: from, $lt: to } } },
      {
        $group: {
          _id: { method: "$method", type: "$type", day: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } } },
          amountPaise: { $sum: "$amountPaise" }
        }
      }
    ]),
    BanquetBooking.aggregate([
      {
        $match: {
          restaurantId: toObjectId(restaurantId),
          date: { $gte: from, $lt: to },
          status: { $in: ["confirmed", "completed"] }
        }
      },
      { $group: { _id: null, total: { $sum: "$totalAmountPaise" } } }
    ])
  ]);

  const daily = new Map<
    string,
    { room: number; fnb: number; extra: number; tax: number; collected: number; occupied: number }
  >();
  for (let i = 0; i < days; i += 1) {
    daily.set(dayKey(new Date(from.getTime() + i * DAY_MS)), {
      room: 0,
      fnb: 0,
      extra: 0,
      tax: 0,
      collected: 0,
      occupied: 0
    });
  }

  let roomRevenue = 0;
  let fnbRevenue = 0;
  let extraRevenue = 0;
  let tax = 0;

  for (const row of chargeAgg) {
    const bucket = daily.get(row._id.day);
    const amount = roundPaise(row.amountPaise ?? 0);
    const taxPart = roundPaise(row.taxPaise ?? 0);
    tax += taxPart;
    if (bucket) bucket.tax += taxPart;
    if (row._id.type === "room") {
      roomRevenue += amount;
      if (bucket) bucket.room += amount;
    } else if (row._id.type === "fnb") {
      fnbRevenue += amount;
      if (bucket) bucket.fnb += amount;
    } else {
      extraRevenue += amount;
      if (bucket) bucket.extra += amount;
    }
  }

  let collected = 0;
  let refunded = 0;
  const byMethodMap = new Map<string, { collected: number; refunded: number }>();
  for (const row of paymentAgg) {
    const amount = roundPaise(row.amountPaise ?? 0);
    const method = String(row._id.method);
    const entry = byMethodMap.get(method) ?? { collected: 0, refunded: 0 };
    if (row._id.type === "refund") {
      refunded += amount;
      entry.refunded += amount;
    } else {
      collected += amount;
      entry.collected += amount;
      const bucket = daily.get(row._id.day);
      if (bucket) bucket.collected += amount;
    }
    byMethodMap.set(method, entry);
  }

  const [arrivals, departures, noShows, cancellations, inHouse, sourceAgg] = await Promise.all([
    Reservation.countDocuments({ restaurantId, checkIn: { $gte: from, $lt: to }, status: { $ne: "cancelled" } }),
    Reservation.countDocuments({ restaurantId, checkOut: { $gte: from, $lt: to }, status: { $ne: "cancelled" } }),
    Reservation.countDocuments({ restaurantId, checkIn: { $gte: from, $lt: to }, status: "no_show" }),
    Reservation.countDocuments({ restaurantId, cancelledAt: { $gte: from, $lt: to } }),
    Reservation.countDocuments({ restaurantId, status: "checked_in" }),
    Reservation.aggregate([
      {
        $match: {
          restaurantId: toObjectId(restaurantId),
          checkIn: { $gte: from, $lt: to },
          status: { $ne: "cancelled" }
        }
      },
      { $group: { _id: "$source", reservations: { $sum: 1 }, roomPaise: { $sum: "$rateSnapshot" } } }
    ])
  ]);

  const occupiedByDay = await RoomNight.aggregate([
    { $match: { restaurantId: toObjectId(restaurantId), date: { $gte: from, $lt: to } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, rooms: { $sum: 1 } } }
  ]);
  for (const row of occupiedByDay) {
    const bucket = daily.get(row._id);
    if (bucket) bucket.occupied = row.rooms ?? 0;
  }

  const capacity = Math.max(1, rooms * days);

  return {
    from: dayKey(from),
    to: dayKey(new Date(to.getTime() - DAY_MS)),
    days,
    rooms,
    occupancyPercent: Math.round((occupiedNights / capacity) * 1000) / 10,
    adr: Math.round(roomRevenue / Math.max(1, occupiedNights)),
    revpar: Math.round(roomRevenue / capacity),
    roomRevenue,
    fnbRevenue,
    extraRevenue,
    tax,
    banquetRevenue: roundPaise(banquetAgg[0]?.total ?? 0),
    collected,
    refunded,
    bySource: sourceAgg.map((row) => ({
      source: String(row._id ?? "walk_in"),
      reservations: row.reservations ?? 0,
      revenue: roundPaise(row.roomPaise ?? 0)
    })),
    byMethod: Array.from(byMethodMap.entries()).map(([method, value]) => ({ method, ...value })),
    daily: Array.from(daily.entries()).map(([date, value]) => ({ date, ...value })),
    arrivals,
    departures,
    noShows,
    cancellations,
    inHouse
  };
}

/** Sectioned CSV so finance can open it in Excel or a script. */
export function reportToCsv(report: HotelReport): string {
  const money = (paise: number) => (paise / 100).toFixed(2);
  const lines: string[] = ["section,key,value"];
  lines.push(`summary,from,${report.from}`);
  lines.push(`summary,to,${report.to}`);
  lines.push(`summary,rooms,${report.rooms}`);
  lines.push(`summary,occupancy%,${report.occupancyPercent}`);
  lines.push(`summary,adr,${money(report.adr)}`);
  lines.push(`summary,revpar,${money(report.revpar)}`);
  lines.push(`summary,roomRevenue,${money(report.roomRevenue)}`);
  lines.push(`summary,fnbRevenue,${money(report.fnbRevenue)}`);
  lines.push(`summary,extraRevenue,${money(report.extraRevenue)}`);
  lines.push(`summary,banquetRevenue,${money(report.banquetRevenue)}`);
  lines.push(`summary,tax,${money(report.tax)}`);
  lines.push(`summary,collected,${money(report.collected)}`);
  lines.push(`summary,refunded,${money(report.refunded)}`);
  lines.push(`summary,arrivals,${report.arrivals}`);
  lines.push(`summary,departures,${report.departures}`);
  lines.push(`summary,noShows,${report.noShows}`);
  lines.push(`summary,cancellations,${report.cancellations}`);
  for (const row of report.bySource) {
    lines.push(`source,${row.source},${row.reservations} stays / ${money(row.revenue)}`);
  }
  for (const row of report.byMethod) {
    lines.push(`method,${row.method},${money(row.collected)} in / ${money(row.refunded)} out`);
  }
  lines.push("date,room,fnb,extra,tax,collected,occupiedRooms");
  for (const row of report.daily) {
    lines.push(
      [
        row.date,
        money(row.room),
        money(row.fnb),
        money(row.extra),
        money(row.tax),
        money(row.collected),
        row.occupied
      ].join(",")
    );
  }
  return lines.join("\n");
}

/** Night audit totals for one business date, including cash per user. */
export async function businessDateTotals(restaurantId: string, date: Date) {
  const start = date;
  const end = new Date(date.getTime() + DAY_MS);

  const [charges, payments] = await Promise.all([
    FolioCharge.aggregate([
      { $match: { restaurantId: toObjectId(restaurantId), postedAt: { $gte: start, $lt: end } } },
      { $group: { _id: "$type", amountPaise: { $sum: "$amountPaise" }, taxPaise: { $sum: "$taxPaise" } } }
    ]),
    HotelPayment.aggregate([
      { $match: { restaurantId: toObjectId(restaurantId), paidAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { method: "$method", type: "$type", createdBy: "$createdBy" },
          amountPaise: { $sum: "$amountPaise" }
        }
      }
    ])
  ]);

  const totals = {
    roomPaise: 0,
    fnbPaise: 0,
    extraPaise: 0,
    taxPaise: 0,
    collectedPaise: 0,
    refundedPaise: 0,
    banquetPaise: 0
  };

  for (const row of charges) {
    const amount = roundPaise(row.amountPaise ?? 0);
    if (row._id === "room") totals.roomPaise += amount;
    else if (row._id === "fnb") totals.fnbPaise += amount;
    else totals.extraPaise += amount;
    totals.taxPaise += roundPaise(row.taxPaise ?? 0);
  }

  const cashByUser = new Map<string, number>();
  for (const row of payments) {
    const amount = roundPaise(row.amountPaise ?? 0);
    if (row._id.type === "refund") totals.refundedPaise += amount;
    else totals.collectedPaise += amount;
    if (row._id.method === "cash" && row._id.type !== "refund") {
      const key = String(row._id.createdBy ?? "system");
      cashByUser.set(key, (cashByUser.get(key) ?? 0) + amount);
    }
  }

  return { totals, cashByUser };
}

export async function closedBusinessDates(restaurantId: string, limit = 14) {
  return BusinessDate.find({ restaurantId }).sort({ date: -1 }).limit(limit).lean();
}
