import Link from "next/link";
import { redirect } from "next/navigation";

import { HotelTabs } from "@/components/hotel/hotel-tabs";
import { requireSession } from "@/lib/auth/guards";
import { connectToDatabase } from "@/lib/db/connect";
import { addDays, toUtcDate } from "@/lib/hotel/availability";
import { hasModule } from "@/lib/modules";
import { BanquetBooking, Hall, Reservation, Restaurant, Room } from "@/models";

export const dynamic = "force-dynamic";

const iso = (date: Date) => new Date(date).toISOString().slice(0, 10);

export default async function HotelOverviewPage() {
  const session = await requireSession();
  await connectToDatabase();

  const restaurant = await Restaurant.findById(session.restaurantId)
    .select("enabledModules currency settings.checkInTime settings.checkOutTime")
    .lean();

  const roomsOn = hasModule(restaurant, "rooms");
  const banquetOn = hasModule(restaurant, "banquet");
  if (!roomsOn && !banquetOn) redirect("/dashboard");

  const modules = (restaurant?.enabledModules ?? []) as string[];
  const today = toUtcDate(new Date());

  const [rooms, stays, halls, events] = await Promise.all([
    roomsOn
      ? Room.find({ restaurantId: session.restaurantId }).select("number status").lean()
      : Promise.resolve([]),
    roomsOn
      ? Reservation.find({
          restaurantId: session.restaurantId,
          status: { $in: ["tentative", "confirmed", "checked_in"] },
          checkIn: { $lte: today },
          checkOut: { $gte: today }
        })
          .populate({ path: "guestId", select: "name" })
          .lean()
      : Promise.resolve([]),
    banquetOn
      ? Hall.find({ restaurantId: session.restaurantId }).select("name").lean()
      : Promise.resolve([]),
    banquetOn
      ? BanquetBooking.find({
          restaurantId: session.restaurantId,
          status: { $ne: "cancelled" },
          date: { $gte: today, $lt: addDays(today, 7) }
        })
          .sort({ date: 1 })
          .lean()
      : Promise.resolve([])
  ]);

  const roomById = new Map(rooms.map((room) => [String(room._id), room]));
  const hallById = new Map(halls.map((hall) => [String(hall._id), hall.name]));

  const inHouse = stays.filter((stay) => stay.status === "checked_in");
  const arrivals = stays.filter((stay) => stay.status !== "checked_in" && iso(stay.checkIn) === iso(today));
  const departures = inHouse.filter((stay) => iso(stay.checkOut) === iso(today));
  const dirty = rooms.filter((room) => room.status === "dirty");
  const occupancy = rooms.length ? Math.round((inHouse.length / rooms.length) * 100) : 0;

  const guestName = (stay: (typeof stays)[number]) =>
    (stay.guestId as unknown as { name?: string } | null)?.name ?? "";
  const roomNumber = (stay: (typeof stays)[number]) => roomById.get(String(stay.roomId))?.number ?? "";

  const stats = [
    roomsOn ? { label: "Occupancy", value: `${occupancy}%` } : null,
    roomsOn ? { label: "In-house", value: `${inHouse.length}` } : null,
    roomsOn ? { label: "Arrivals", value: `${arrivals.length}` } : null,
    roomsOn ? { label: "Departures", value: `${departures.length}` } : null,
    roomsOn ? { label: "Dirty rooms", value: `${dirty.length}` } : null,
    banquetOn ? { label: "Events (7d)", value: `${events.length}` } : null
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <main className="section-shell">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text-primary">Hotel</h1>
        <p className="text-sm text-text-muted">
          {iso(today)} - in {restaurant?.settings?.checkInTime ?? "14:00"} / out{" "}
          {restaurant?.settings?.checkOutTime ?? "11:00"}
        </p>
      </div>

      <HotelTabs modules={modules} />

      <section className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="surface-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">{stat.value}</p>
          </div>
        ))}
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {roomsOn ? (
          <section className="surface-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">Today</h2>
              <Link href="/rooms" className="text-sm font-medium text-accent-primary hover:underline">
                Calendar
              </Link>
            </div>
            <table className="mt-2 w-full text-sm">
              <tbody>
                {arrivals.length === 0 && departures.length === 0 ? (
                  <tr>
                    <td className="py-6 text-center text-text-muted" colSpan={3}>
                      No movements
                    </td>
                  </tr>
                ) : null}
                {arrivals.map((stay) => (
                  <tr key={`in-${String(stay._id)}`} className="border-t border-border-subtle">
                    <td className="py-2 text-text-primary">{guestName(stay)}</td>
                    <td className="py-2 text-text-secondary">Room {roomNumber(stay)}</td>
                    <td className="py-2 text-right text-xs font-semibold uppercase text-emerald-700">
                      Arrival
                    </td>
                  </tr>
                ))}
                {departures.map((stay) => (
                  <tr key={`out-${String(stay._id)}`} className="border-t border-border-subtle">
                    <td className="py-2 text-text-primary">{guestName(stay)}</td>
                    <td className="py-2 text-text-secondary">Room {roomNumber(stay)}</td>
                    <td className="py-2 text-right text-xs font-semibold uppercase text-amber-700">
                      Departure
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {inHouse.length ? (
              <p className="mt-3 text-xs text-text-muted">{inHouse.length} in-house</p>
            ) : null}
          </section>
        ) : null}

        {banquetOn ? (
          <section className="surface-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">Events</h2>
              <Link href="/banquet" className="text-sm font-medium text-accent-primary hover:underline">
                Calendar
              </Link>
            </div>
            <table className="mt-2 w-full text-sm">
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td className="py-6 text-center text-text-muted" colSpan={3}>
                      No events
                    </td>
                  </tr>
                ) : null}
                {events.map((event) => (
                  <tr key={String(event._id)} className="border-t border-border-subtle">
                    <td className="py-2 text-text-primary">{iso(event.date)}</td>
                    <td className="py-2 text-text-secondary">
                      {hallById.get(String(event.hallId)) ?? ""} - {event.slot.replace("_", " ")}
                    </td>
                    <td className="py-2 text-right tabular-nums text-text-secondary">{event.guestCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
      </div>
    </main>
  );
}
