import { redirect } from "next/navigation";

import { HotelTabs } from "@/components/hotel/hotel-tabs";
import { RatePlanRow, RatesScreen } from "@/components/hotel/rates-screen";
import { requireSession } from "@/lib/auth/guards";
import { connectToDatabase } from "@/lib/db/connect";
import { toRupees } from "@/lib/hotel/money";
import { hasModule } from "@/lib/modules";
import { RatePlan, Restaurant, RoomType } from "@/models";

export const dynamic = "force-dynamic";

const iso = (date?: Date | null) => (date ? new Date(date).toISOString().slice(0, 10) : "");

export default async function RatesPage() {
  const session = await requireSession();
  await connectToDatabase();

  const restaurant = await Restaurant.findById(session.restaurantId).select("enabledModules").lean();
  if (!hasModule(restaurant, "rooms")) redirect("/dashboard");

  const [plans, types] = await Promise.all([
    RatePlan.find({ restaurantId: session.restaurantId }).sort({ priority: -1, createdAt: -1 }).lean(),
    RoomType.find({ restaurantId: session.restaurantId }).select("name").lean()
  ]);
  const typeName = new Map(types.map((type) => [String(type._id), type.name]));

  const rows: RatePlanRow[] = plans.map((plan) => ({
    id: String(plan._id),
    name: plan.name,
    roomTypeId: plan.roomTypeId ? String(plan.roomTypeId) : "",
    roomTypeName: plan.roomTypeId ? typeName.get(String(plan.roomTypeId)) ?? "" : "All room types",
    dateFrom: iso(plan.dateFrom),
    dateTo: iso(plan.dateTo),
    weekdays: plan.weekdays ?? [],
    baseRate: toRupees(plan.baseRatePaise),
    mealPlan: plan.mealPlan ?? "EP",
    mealPlanAmount: toRupees(plan.mealPlanPaise),
    discountCode: plan.discountCode ?? "",
    discountPercent: plan.discountPercent ?? 0,
    minNights: plan.minNights ?? 1,
    active: plan.active !== false
  }));

  return (
    <main className="section-shell">
      <HotelTabs modules={(restaurant?.enabledModules ?? []) as string[]} />
      <RatesScreen
        plans={rows}
        roomTypes={types.map((type) => ({ id: String(type._id), name: type.name }))}
      />
    </main>
  );
}
