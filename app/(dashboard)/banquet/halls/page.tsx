import { redirect } from "next/navigation";

import { HallsScreen, type HallRow } from "@/components/hotel/halls-screen";
import { HotelTabs } from "@/components/hotel/hotel-tabs";
import { requireSession } from "@/lib/auth/guards";
import { connectToDatabase } from "@/lib/db/connect";
import { hasModule } from "@/lib/modules";
import { Hall, Restaurant } from "@/models";

export const dynamic = "force-dynamic";

export default async function BanquetHallsPage() {
  const session = await requireSession();
  await connectToDatabase();

  const restaurant = await Restaurant.findById(session.restaurantId).select("enabledModules").lean();
  if (!hasModule(restaurant, "banquet")) redirect("/dashboard");

  const hallsRaw = await Hall.find({ restaurantId: session.restaurantId }).sort({ name: 1 }).lean();

  const halls: HallRow[] = hallsRaw.map((hall) => ({
    id: String(hall._id),
    name: hall.name,
    capacity: hall.capacity,
    baseRate: hall.baseRate ?? 0
  }));

  return (
    <main className="section-shell">
      <HotelTabs modules={(restaurant?.enabledModules ?? []) as string[]} />
      <HallsScreen halls={halls} />
    </main>
  );
}
