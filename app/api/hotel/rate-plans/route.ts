import { NextRequest } from "next/server";

import { fail, handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { auditHotel } from "@/lib/hotel/audit";
import { toPaise, toRupees } from "@/lib/hotel/money";
import { requireModuleForTenant } from "@/lib/modules";
import { ratePlanSchema } from "@/lib/validators/hotel";
import { RatePlan, RoomType } from "@/models";

const iso = (date?: Date | null) => (date ? new Date(date).toISOString().slice(0, 10) : "");

export async function GET(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk", "cashier"], async (_req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const [plans, types] = await Promise.all([
        RatePlan.find({ restaurantId: session.restaurantId }).sort({ priority: -1, createdAt: -1 }).lean(),
        RoomType.find({ restaurantId: session.restaurantId }).select("name").lean()
      ]);
      const typeName = new Map(types.map((type) => [String(type._id), type.name]));

      return ok(
        plans.map((plan) => ({
          id: String(plan._id),
          name: plan.name,
          roomTypeId: plan.roomTypeId ? String(plan.roomTypeId) : "",
          roomTypeName: plan.roomTypeId ? typeName.get(String(plan.roomTypeId)) ?? "" : "All room types",
          dateFrom: iso(plan.dateFrom),
          dateTo: iso(plan.dateTo),
          weekdays: plan.weekdays ?? [],
          baseRate: toRupees(plan.baseRatePaise),
          extraAdult: toRupees(plan.extraAdultPaise),
          child: toRupees(plan.childPaise),
          includedAdults: plan.includedAdults ?? 2,
          includedChildren: plan.includedChildren ?? 0,
          mealPlan: plan.mealPlan ?? "EP",
          mealPlanAmount: toRupees(plan.mealPlanPaise),
          discountCode: plan.discountCode ?? "",
          discountPercent: plan.discountPercent ?? 0,
          minNights: plan.minNights ?? 1,
          priority: plan.priority ?? 0,
          active: plan.active !== false
        }))
      );
    })(request, {});
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const parsed = ratePlanSchema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input", 422);
      const data = parsed.data;

      const plan = await RatePlan.create({
        restaurantId: session.restaurantId,
        name: data.name,
        roomTypeId: data.roomTypeId || undefined,
        dateFrom: data.dateFrom ? new Date(`${data.dateFrom}T00:00:00.000Z`) : undefined,
        dateTo: data.dateTo ? new Date(`${data.dateTo}T00:00:00.000Z`) : undefined,
        weekdays: data.weekdays,
        baseRatePaise: toPaise(data.baseRate),
        extraAdultPaise: toPaise(data.extraAdult),
        childPaise: toPaise(data.child),
        includedAdults: data.includedAdults,
        includedChildren: data.includedChildren,
        mealPlan: data.mealPlan,
        mealPlanPaise: toPaise(data.mealPlanAmount),
        discountCode: data.discountCode ? data.discountCode.toUpperCase() : undefined,
        discountPercent: data.discountPercent,
        minNights: data.minNights,
        priority: data.priority,
        active: data.active
      }).catch((error) => {
        if (typeof error === "object" && error !== null && (error as { code?: number }).code === 11000) {
          throw new Error("That discount code is already used by another plan");
        }
        throw error;
      });

      await auditHotel({
        restaurantId: session.restaurantId,
        actorId: session.userId,
        action: "rate_plan.create",
        targetType: "rate_plan",
        targetId: String(plan._id),
        meta: { name: data.name }
      });

      return ok({ id: String(plan._id) }, { status: 201 });
    })(request, {});
  } catch (error) {
    return handleRouteError(error);
  }
}
