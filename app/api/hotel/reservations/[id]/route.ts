import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { withTransaction } from "@/lib/db/transaction";
import { auditHotel } from "@/lib/hotel/audit";
import { isRoomAvailable, nightsBetween, toUtcDate } from "@/lib/hotel/availability";
import { loadHotelSettings, type HotelSettings } from "@/lib/hotel/booking";
import { computeCancellation, hoursUntil } from "@/lib/hotel/cancellation";
import {
  balancePaise,
  folioTotals,
  issueInvoice,
  paidPaiseFor,
  postFolioCharge,
  postRoomNights,
  recordPayment,
  settleFolio
} from "@/lib/hotel/folio";
import { acquireRoomNights, moveRoomNights, releaseRoomNights } from "@/lib/hotel/inventory";
import { canSeePii } from "@/lib/hotel/mask";
import { quoteStay } from "@/lib/hotel/rates";
import { requireModuleForTenant } from "@/lib/modules";
import { reservationActionSchemaV2, reservationEditSchema } from "@/lib/validators/hotel";
import { Customer, Folio, FolioCharge, HousekeepingTask, Reservation, Room } from "@/models";

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED: Record<string, string[]> = {
  confirm: ["tentative"],
  cancel: ["tentative", "confirmed"],
  no_show: ["tentative", "confirmed"],
  check_in: ["tentative", "confirmed"],
  check_out: ["checked_in"],
  move: ["tentative", "confirmed", "checked_in"],
  extend: ["tentative", "confirmed", "checked_in"]
};

class RouteError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
  }
}

const sessionOptions = (session: unknown) => (session ? { session: session as never } : {});
const hourOf = (value: string, fallback: number) => {
  const [h] = (value || "").split(":");
  const parsed = Number(h);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** Early check-in / late check-out fee, waived on request. */
async function postTimingFee(params: {
  restaurantId: string;
  reservationId: string;
  type: "early_check_in" | "late_check_out";
  amountPaise: number;
  session?: unknown;
}) {
  if (params.amountPaise <= 0) return;
  await postFolioCharge({
    restaurantId: params.restaurantId,
    reservationId: params.reservationId,
    type: "extra",
    amountPaise: params.amountPaise,
    description: params.type === "early_check_in" ? "Early check-in" : "Late check-out",
    session: params.session as never
  });
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    return withAuth<Ctx>(["owner", "manager", "front_desk"], async (req, context, auth) => {
      await requireModuleForTenant(auth.restaurantId, "rooms");
      await connectToDatabase();
      const { id } = await context.params;

      const parsed = reservationActionSchemaV2.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid action", 422);
      const { action, override, waiveFees, reason } = parsed.data;
      const allowedFrom = ALLOWED[action] ?? [];
      const canOverride = auth.role === "owner" || auth.role === "manager";
      const settings = await loadHotelSettings(auth.restaurantId);

      const set: Record<string, unknown> = {};
      if (action === "confirm") {
        set.status = "confirmed";
        set.holdExpiresAt = null;
      } else if (action === "cancel") {
        set.status = "cancelled";
        set.cancelledAt = new Date();
      } else if (action === "no_show") set.status = "no_show";
      else if (action === "check_in") {
        set.status = "checked_in";
        set.checkedInAt = new Date();
      } else if (action === "check_out") {
        set.status = "checked_out";
        set.checkedOutAt = new Date();
      }

      try {
        const result = await withTransaction(async (tx) => {
          const reservation = await Reservation.findOneAndUpdate(
            { _id: id, restaurantId: auth.restaurantId, status: { $in: allowedFrom } },
            { $set: set },
            { new: true, ...sessionOptions(tx) }
          ).lean();

          if (!reservation) {
            const current = await Reservation.findOne({ _id: id, restaurantId: auth.restaurantId })
              .select("status")
              .session(tx ?? null)
              .lean();
            if (!current) throw new RouteError("Reservation not found", 404);
            throw new RouteError(`Cannot ${action.replace("_", " ")} a ${current.status} reservation`, 409);
          }

          const outcome = await applyAction({
            action,
            reservation,
            settings,
            restaurantId: auth.restaurantId,
            userId: auth.userId,
            userName: auth.name,
            override: Boolean(override),
            waiveFees: Boolean(waiveFees),
            roomId: parsed.data.roomId,
            checkOut: parsed.data.checkOut,
            canOverride,
            tx
          });

          return { status: reservation.status, ...outcome };
        });

        await auditHotel({
          restaurantId: auth.restaurantId,
          actorId: auth.userId,
          action: `reservation.${action}`,
          targetType: "reservation",
          targetId: id,
          meta: { status: result.status, reason: reason ?? null, override: Boolean(override) }
        });

        return ok({ id, ...result });
      } catch (error) {
        if (error instanceof RouteError) return fail(error.message, error.statusCode);
        throw error;
      }
    })(request, ctx);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    return withAuth<Ctx>(["owner", "manager", "front_desk"], async (req, context, auth) => {
      await requireModuleForTenant(auth.restaurantId, "rooms");
      await connectToDatabase();
      const { id } = await context.params;

      const parsed = reservationEditSchema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);

      const reservation = await Reservation.findOne({ _id: id, restaurantId: auth.restaurantId }).lean();
      if (!reservation) return fail("Reservation not found", 404);
      if (reservation.status === "cancelled" || reservation.status === "checked_out") {
        return fail(`Cannot edit a ${reservation.status} reservation`, 409);
      }

      const set: Record<string, unknown> = {};
      if (parsed.data.adults !== undefined) set.adults = parsed.data.adults;
      if (parsed.data.children !== undefined) set.children = parsed.data.children;
      if (parsed.data.notes !== undefined) set.notes = parsed.data.notes;
      if (parsed.data.discountCode !== undefined) {
        set.discountCode = parsed.data.discountCode ? parsed.data.discountCode.toUpperCase() : null;
      }

      const guestIn = (parsed.data.guest ?? {}) as Record<string, unknown>;
      const guestSet: Record<string, unknown> = {};
      for (const key of ["name", "phone", "email", "idType", "idNumber"]) {
        if (guestIn[key] !== undefined) guestSet[key] = guestIn[key] === "" ? null : guestIn[key];
      }

      if (Object.keys(set).length) {
        await Reservation.updateOne({ _id: id, restaurantId: auth.restaurantId }, { $set: set });
      }
      if (Object.keys(guestSet).length) {
        await Customer.updateOne(
          { _id: reservation.guestId, restaurantId: auth.restaurantId },
          { $set: guestSet }
        );
      }

      await auditHotel({
        restaurantId: auth.restaurantId,
        actorId: auth.userId,
        action: "reservation.edit",
        targetType: "reservation",
        targetId: id,
        meta: { fields: [...Object.keys(set), ...Object.keys(guestSet)], piiVisible: canSeePii(auth.role) }
      });

      return ok({ id, updated: [...Object.keys(set), ...Object.keys(guestSet)] });
    })(request, ctx);
  } catch (error) {
    return handleRouteError(error);
  }
}

type ActionParams = {
  action: string;
  reservation: Record<string, any>;
  settings: HotelSettings;
  restaurantId: string;
  userId?: string;
  userName?: string;
  override: boolean;
  waiveFees: boolean;
  roomId?: string;
  checkOut?: string;
  canOverride: boolean;
  tx: unknown;
};

async function applyAction(p: ActionParams) {
  const rid = String(p.reservation._id);
  const { restaurantId, settings } = p;
  const tx = p.tx as never;

  if (p.action === "cancel" || p.action === "no_show") {
    await releaseRoomNights(restaurantId, rid, tx);
    const nights = nightsBetween(new Date(p.reservation.checkIn), new Date(p.reservation.checkOut));
    const nightly = p.reservation.rateSnapshot ?? 0;
    const paid = await paidPaiseFor(restaurantId, rid, tx);

    const policy = computeCancellation(
      {
        policy: settings.cancellation,
        nights,
        nightlyPaise: nightly,
        stayPaise: nightly * nights,
        hoursToCheckIn: hoursUntil(new Date(p.reservation.checkIn), hourOf(settings.checkInTime, 14))
      },
      paid
    );

    // A no-show keeps what was collected; a cancellation refunds down to the penalty.
    const refund = p.action === "cancel" ? policy.refundablePaise : 0;
    if (refund > 0) {
      await recordPayment({
        restaurantId,
        reservationId: rid,
        amountPaise: refund,
        method: "cash",
        type: "refund",
        notes: "Cancellation refund",
        createdBy: p.userId,
        session: tx
      });
    }
    await Reservation.updateOne(
      { _id: rid, restaurantId },
      { $set: { cancellationFeePaise: policy.penaltyPaise, refundedPaise: refund } },
      sessionOptions(tx)
    );
    return { penalty: policy.penaltyPaise, refund };
  }

  if (p.action === "check_in") {
    await postRoomNights({ restaurantId, reservationId: rid, slabs: settings.slabs, session: tx });
    await Room.updateOne(
      { _id: p.reservation.roomId, restaurantId },
      { $set: { status: "occupied" } },
      sessionOptions(tx)
    );

    const now = new Date();
    const arrival = new Date(p.reservation.checkIn);
    const sameDayEarly =
      now.toISOString().slice(0, 10) === arrival.toISOString().slice(0, 10) &&
      now.getUTCHours() < hourOf(settings.checkInTime, 14);
    if (!p.waiveFees && (now < arrival || sameDayEarly)) {
      await postTimingFee({
        restaurantId,
        reservationId: rid,
        type: "early_check_in",
        amountPaise: settings.earlyCheckInFeePaise,
        session: tx
      });
    }
    return {};
  }

  if (p.action === "move") {
    if (!p.roomId) throw new RouteError("Target room required", 422);
    const target = await Room.findOne({ _id: p.roomId, restaurantId }).session(p.tx as never).lean();
    if (!target) throw new RouteError("Target room not found", 404);
    if (target.status === "maintenance") throw new RouteError(`Room ${target.number} is out of service`, 409);

    const today = toUtcDate(new Date());
    const stayStart = new Date(p.reservation.checkIn);
    const from = stayStart > today ? stayStart : today;
    const to = new Date(p.reservation.checkOut);
    if (!(from < to)) throw new RouteError("Nothing left to move", 409);

    const free = await isRoomAvailable({
      restaurantId,
      roomId: String(target._id),
      checkIn: from,
      checkOut: to,
      ignoreReservationId: rid,
      session: p.tx as never
    });
    if (!free) throw new RouteError(`Room ${target.number} is not free for the rest of the stay`, 409);

    const quote = await quoteStay({
      restaurantId,
      roomTypeId: String(target.roomTypeId),
      checkIn: from,
      checkOut: to,
      adults: p.reservation.adults ?? 2,
      children: p.reservation.children ?? 0,
      slabs: settings.slabs,
      session: p.tx as never
    });

    const { RoomNight } = await import("@/models");
    await RoomNight.deleteMany(
      { restaurantId, reservationId: rid, date: { $gte: from, $lt: to } },
      sessionOptions(tx)
    );
    await acquireRoomNights({
      restaurantId,
      roomId: String(target._id),
      reservationId: rid,
      checkIn: from,
      checkOut: to,
      nightlyPaise: quote.nightlyFromPaise,
      rates: quote.nights,
      session: tx
    });
    await Reservation.updateOne(
      { _id: rid, restaurantId },
      { $set: { roomId: target._id, rateSnapshot: quote.nightlyFromPaise } },
      sessionOptions(tx)
    );
    // Future room charges re-post at the new room's tariff.
    await FolioCharge.deleteMany(
      { restaurantId, reservationId: rid, type: "room", stayDate: { $gte: from } },
      sessionOptions(tx)
    );

    if (p.reservation.status === "checked_in") {
      await Room.updateOne(
        { _id: p.reservation.roomId, restaurantId },
        { $set: { status: "dirty" } },
        sessionOptions(tx)
      );
      await Room.updateOne(
        { _id: target._id, restaurantId },
        { $set: { status: "occupied" } },
        sessionOptions(tx)
      );
    }

    return { roomId: String(target._id), roomNumber: target.number };
  }

  if (p.action === "extend") {
    if (!p.checkOut) throw new RouteError("New check-out required", 422);
    const newCheckOut = toUtcDate(p.checkOut);
    const oldCheckOut = new Date(p.reservation.checkOut);
    if (!(newCheckOut > oldCheckOut)) throw new RouteError("New check-out must be later", 422);

    const room = await Room.findById(p.reservation.roomId).select("roomTypeId").session(p.tx as never).lean();
    if (!room) throw new RouteError("Room not found", 404);

    const quote = await quoteStay({
      restaurantId,
      roomTypeId: String(room.roomTypeId),
      checkIn: new Date(p.reservation.checkIn),
      checkOut: newCheckOut,
      adults: p.reservation.adults ?? 2,
      children: p.reservation.children ?? 0,
      slabs: settings.slabs,
      session: p.tx as never
    });

    const oldKey = oldCheckOut.toISOString().slice(0, 10);
    await acquireRoomNights({
      restaurantId,
      roomId: String(p.reservation.roomId),
      reservationId: rid,
      checkIn: oldCheckOut,
      checkOut: newCheckOut,
      nightlyPaise: quote.nightlyFromPaise,
      rates: quote.nights.filter((night) => night.date >= oldKey),
      session: tx
    });
    await Reservation.updateOne(
      { _id: rid, restaurantId },
      { $set: { checkOut: newCheckOut } },
      sessionOptions(tx)
    );
    return { checkOut: newCheckOut.toISOString().slice(0, 10) };
  }

  if (p.action === "check_out") {
    await postRoomNights({ restaurantId, reservationId: rid, slabs: settings.slabs, session: tx });

    const now = new Date();
    const departure = new Date(p.reservation.checkOut);
    const sameDay = now.toISOString().slice(0, 10) === departure.toISOString().slice(0, 10);
    if (!p.waiveFees && sameDay && now.getUTCHours() >= hourOf(settings.checkOutTime, 11) + 2) {
      await postTimingFee({
        restaurantId,
        reservationId: rid,
        type: "late_check_out",
        amountPaise: settings.lateCheckOutFeePaise,
        session: tx
      });
    }

    const folio = await Folio.findOne({ restaurantId, reservationId: rid }).session(p.tx as never).lean();
    const charges = folio
      ? await FolioCharge.find({ restaurantId, folioId: folio._id }).session(p.tx as never).lean()
      : [];
    const totals = folioTotals(charges);
    const paid = await paidPaiseFor(restaurantId, rid, tx);
    const balance = balancePaise(totals.totalPaise, paid);

    if (balance > 0) {
      if (!p.override) throw new RouteError(`Folio balance is ${(balance / 100).toFixed(2)}`, 409);
      if (!p.canOverride) throw new RouteError("Only a manager can override an open balance", 403);
    }

    await issueInvoice({ restaurantId, reservationId: rid, prefix: settings.invoicePrefix, session: tx });
    await settleFolio(restaurantId, rid, tx);
    await releaseRoomNights(restaurantId, rid, tx);
    await Room.updateOne(
      { _id: p.reservation.roomId, restaurantId },
      { $set: { status: "dirty" } },
      sessionOptions(tx)
    );

    const pending = await HousekeepingTask.findOne({
      restaurantId,
      roomId: p.reservation.roomId,
      status: { $in: ["pending", "in_progress"] }
    })
      .session(p.tx as never)
      .lean();
    if (!pending) {
      await HousekeepingTask.create(
        [{ restaurantId, roomId: p.reservation.roomId, status: "pending", assignee: p.userName }],
        sessionOptions(tx)
      );
    }

    return { balance, invoiceIssued: true };
  }

  return {};
}

