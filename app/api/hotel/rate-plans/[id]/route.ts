import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { toPaise } from "@/lib/hotel/money";
import { requireModuleForTenant } from "@/lib/modules";
import { ratePlanSchema } from "@/lib/validators/hotel";
import { RatePlan } from "@/models";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    return withAuth<Ctx>(["owner", "manager"], async (req, context, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();
      const { id } = await context.params;

      const parsed = ratePlanSchema.partial().safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);
      const data = parsed.data;

      const set: Record<string, unknown> = {};
      if (data.name !== undefined) set.name = data.name;
      if (data.roomTypeId !== undefined) set.roomTypeId = data.roomTypeId || null;
      if (data.dateFrom !== undefined) set.dateFrom = data.dateFrom ? new Date(`${data.dateFrom}T00:00:00.000Z`) : null;
      if (data.dateTo !== undefined) set.dateTo = data.dateTo ? new Date(`${data.dateTo}T00:00:00.000Z`) : null;
      if (data.weekdays !== undefined) set.weekdays = data.weekdays;
      if (data.baseRate !== undefined) set.baseRatePaise = toPaise(data.baseRate);
      if (data.extraAdult !== undefined) set.extraAdultPaise = toPaise(data.extraAdult);
      if (data.child !== undefined) set.childPaise = toPaise(data.child);
      if (data.includedAdults !== undefined) set.includedAdults = data.includedAdults;
      if (data.includedChildren !== undefined) set.includedChildren = data.includedChildren;
      if (data.mealPlan !== undefined) set.mealPlan = data.mealPlan;
      if (data.mealPlanAmount !== undefined) set.mealPlanPaise = toPaise(data.mealPlanAmount);
      if (data.discountCode !== undefined) set.discountCode = data.discountCode ? data.discountCode.toUpperCase() : null;
      if (data.discountPercent !== undefined) set.discountPercent = data.discountPercent;
      if (data.minNights !== undefined) set.minNights = data.minNights;
      if (data.priority !== undefined) set.priority = data.priority;
      if (data.active !== undefined) set.active = data.active;

      const updated = await RatePlan.findOneAndUpdate(
        { _id: id, restaurantId: session.restaurantId },
        { $set: set },
        { new: true }
      ).lean();
      if (!updated) return fail("Rate plan not found", 404);

      return ok({ id, active: updated.active });
    })(request, ctx);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
    return withAuth<Ctx>(["owner", "manager"], async (_req, context, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();
      const { id } = await context.params;

      // Soft delete: past reservations keep their snapshot, the plan stops quoting.
      const updated = await RatePlan.findOneAndUpdate(
        { _id: id, restaurantId: session.restaurantId },
        { $set: { active: false } },
        { new: true }
      ).lean();
      if (!updated) return fail("Rate plan not found", 404);

      return ok({ id, active: false });
    })(request, ctx);
  } catch (error) {
    return handleRouteError(error);
  }
}
