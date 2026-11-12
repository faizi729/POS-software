import { redirect } from "next/navigation";

import { HotelTabs } from "@/components/hotel/hotel-tabs";
import { BanquetScreen, type BanquetHall, type BanquetRow } from "@/components/hotel/banquet-screen";
import { requireSession } from "@/lib/auth/guards";
import { connectToDatabase } from "@/lib/db/connect";
import { addDays, expireStaleHolds, toUtcDate } from "@/lib/hotel/availability";
import { toRupees } from "@/lib/hotel/money";
import { hasModule } from "@/lib/modules";
import { BanquetBooking, Hall, Restaurant } from "@/models";

export const dynamic = "force-dynamic";

const iso = (date: Date) => date.toISOString().slice(0, 10);

export default async function BanquetPage() {
  const session = await requireSession();
  await connectToDatabase();

  const restaurant = await Restaurant.findById(session.restaurantId)
    .select("enabledModules currency")
    .lean();
  if (!hasModule(restaurant, "banquet")) redirect("/dashboard");

  await expireStaleHolds(session.restaurantId);
  const today = toUtcDate(new Date());

  const [hallsRaw, bookingsRaw] = await Promise.all([
    Hall.find({ restaurantId: session.restaurantId }).sort({ name: 1 }).lean(),
    BanquetBooking.find({
      restaurantId: session.restaurantId,
      status: { $ne: "cancelled" },
      date: { $gte: today, $lt: addDays(today, 14) }
    })
      .sort({ date: 1 })
      .lean()
  ]);

  const halls: BanquetHall[] = hallsRaw.map((hall) => ({
    id: String(hall._id),
    name: hall.name,
    capacity: hall.capacity,
    baseRate: hall.baseRate ?? 0
  }));

  const bookings: BanquetRow[] = bookingsRaw.map((booking) => ({
    id: String(booking._id),
    hallId: String(booking.hallId),
    date: iso(new Date(booking.date)),
    slot: booking.slot,
    eventType: booking.eventType ?? "",
    guestCount: booking.guestCount,
    status: booking.status,
    totalAmount: toRupees(booking.totalAmountPaise ?? 0),
    advancePaid: toRupees(booking.advancePaidPaise ?? 0),
    balance: toRupees(Math.max(0, (booking.totalAmountPaise ?? 0) - (booking.advancePaidPaise ?? 0))),
    perPlate: toRupees(booking.menuPackage?.perPlatePaise ?? 0)
  }));

  return (
    <main className="section-shell">
      <HotelTabs modules={(restaurant?.enabledModules ?? []) as string[]} />
      <BanquetScreen
        halls={halls}
        bookings={bookings}
        currency={restaurant?.currency ?? "INR"}
        today={iso(today)}
      />
    </main>
  );
}
