import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { auditHotel } from "@/lib/hotel/audit";
import { canSeePii, maskIdNumber, maskPhone } from "@/lib/hotel/mask";
import { requireModuleForTenant } from "@/lib/modules";
import { guestSchema } from "@/lib/validators/hotel";
import { Customer, Reservation } from "@/models";

/** Guest search — name or phone, newest stay first. */
export async function GET(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk", "cashier"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const url = new URL(req.url);
      const q = (url.searchParams.get("q") || "").trim();
      const pii = canSeePii(session.role);

      const filter: Record<string, unknown> = { restaurantId: session.restaurantId };
      if (q) {
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [{ name: rx }, { phone: rx }, { email: rx }];
      }

      const guests = await Customer.find(filter).sort({ lastVisitAt: -1, createdAt: -1 }).limit(30).lean();
      const stays = await Reservation.aggregate([
        { $match: { restaurantId: guests[0]?.restaurantId, guestId: { $in: guests.map((guest) => guest._id) } } },
        { $group: { _id: "$guestId", stays: { $sum: 1 }, lastCheckOut: { $max: "$checkOut" } } }
      ]);
      const byGuest = new Map(stays.map((row) => [String(row._id), row]));

      return ok(
        guests.map((guest) => ({
          id: String(guest._id),
          name: guest.name,
          phone: pii ? guest.phone ?? "" : maskPhone(guest.phone),
          email: pii ? guest.email ?? "" : "",
          idType: guest.idType ?? "",
          idNumber: pii ? guest.idNumber ?? "" : maskIdNumber(guest.idNumber),
          stays: byGuest.get(String(guest._id))?.stays ?? 0,
          lastCheckOut: byGuest.get(String(guest._id))?.lastCheckOut
            ? new Date(byGuest.get(String(guest._id))!.lastCheckOut).toISOString().slice(0, 10)
            : null
        }))
      );
    })(request, {});
  } catch (error) {
    return handleRouteError(error);
  }
}

const createSchema = guestSchema;

export async function POST(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);
      const phone = (parsed.data.phone || "").trim();

      if (phone) {
        const existing = await Customer.findOne({ restaurantId: session.restaurantId, phone }).select("_id").lean();
        if (existing) return fail("A guest with that phone already exists", 409);
      }

      const guest = await Customer.create({
        restaurantId: session.restaurantId,
        name: parsed.data.name,
        phone: phone || undefined,
        email: parsed.data.email || undefined,
        idType: parsed.data.idType,
        idNumber: parsed.data.idNumber
      });

      await auditHotel({
        restaurantId: session.restaurantId,
        actorId: session.userId,
        action: "guest.create",
        targetType: "guest",
        targetId: String(guest._id)
      });

      return ok({ id: String(guest._id) }, { status: 201 });
    })(request, {});
  } catch (error) {
    return handleRouteError(error);
  }
}

export const guestSearchSchema = z.object({ q: z.string().optional() });
