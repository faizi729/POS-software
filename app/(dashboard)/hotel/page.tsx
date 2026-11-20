import Link from "next/link";
import { redirect } from "next/navigation";

import { FrontDeskBoard, type BoardReservation, type BoardRoom } from "@/components/hotel/front-desk-board";
import { HotelTabs } from "@/components/hotel/hotel-tabs";
import { requireSession } from "@/lib/auth/guards";
import { connectToDatabase } from "@/lib/db/connect";
import { addDays, expireStaleHolds, nightsBetween, toUtcDate } from "@/lib/hotel/availability";
import { roomState, roomStateCounts, type RoomState } from "@/lib/hotel/room-status";
import { hasModule } from "@/lib/modules";
import { BanquetBooking, Hall, MaintenanceTicket, Reservation, Restaurant, Room } from "@/models";

export const dynamic = "force-dynamic";

type HotelHref =
  | "/hotel"
  | "/rooms"
  | "/rooms/setup"
  | "/housekeeping"
  | "/hotel/maintenance"
  | "/hotel/rates"
  | "/hotel/reports"
  | "/banquet";

const roomChipTone: Record<RoomState, string> = {
  occupied: "border-amber-300 bg-amber-50 text-amber-800",
  vacant: "border-emerald-300 bg-emerald-50 text-emerald-800",
  dirty: "border-orange-300 bg-orange-50 text-orange-800",
  maintenance: "border-rose-300 bg-rose-50 text-rose-800"
};

const roomDotTone: Record<RoomState, string> = {
  occupied: "bg-amber-500",
  vacant: "bg-emerald-500",
  dirty: "bg-orange-500",
  maintenance: "bg-rose-500"
};

const roomStateLabel: Record<RoomState, string> = {
  occupied: "Occupied",
  vacant: "Vacant",
  dirty: "Dirty",
  maintenance: "Maintenance"
};

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
  if (roomsOn) await expireStaleHolds(session.restaurantId);

  const [rooms, stays, halls, events, openTickets] = await Promise.all([
    roomsOn
      ? Room.find({ restaurantId: session.restaurantId }).select("number floor status").lean()
      : Promise.resolve([]),
    roomsOn
      ? Reservation.find({
          restaurantId: session.restaurantId,
          status: { $in: ["tentative", "confirmed", "checked_in"] },
          checkIn: { $lte: addDays(today, 1) },
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
      : Promise.resolve([]),
    roomsOn
      ? MaintenanceTicket.find({ restaurantId: session.restaurantId, status: { $ne: "done" } })
          .select("roomId")
          .lean()
      : Promise.resolve([])
  ]);

  const roomById = new Map(rooms.map((room) => [String(room._id), room]));
  const hallById = new Map(halls.map((hall) => [String(hall._id), hall.name]));

  const inHouse = stays.filter((stay) => stay.status === "checked_in");
  const arrivals = stays.filter((stay) => stay.status !== "checked_in" && new Date(stay.checkIn) <= today);
  const departures = inHouse.filter((stay) => new Date(stay.checkOut) <= today);

  // Canonical room state: a guest in the room wins over a stale dirty/maintenance flag,
  // an open maintenance ticket wins over dirty. Counts therefore always sum to the total.
  const inHouseRoomIds = new Set(inHouse.map((stay) => String(stay.roomId)));
  const ticketRoomIds = new Set(openTickets.map((ticket) => String(ticket.roomId)));

  const roomStates = new Map<string, RoomState>(
    rooms.map((room) => [
      String(room._id),
      roomState({
        status: room.status,
        inHouse: inHouseRoomIds.has(String(room._id)),
        openTicket: ticketRoomIds.has(String(room._id))
      })
    ])
  );
  const counts = roomStateCounts(Array.from(roomStates.values()));

  const dirty = rooms.filter((room) => roomStates.get(String(room._id)) === "dirty");

  const floors = Array.from(new Set(rooms.map((room) => room.floor ?? 1)))
    .sort((a, b) => a - b)
    .map((floor) => ({
      floor,
      rooms: rooms
        .filter((room) => (room.floor ?? 1) === floor)
        .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }))
        .map((room) => ({
          id: String(room._id),
          number: room.number,
          state: roomStates.get(String(room._id)) as RoomState
        }))
    }));

  const toBoard = (stay: (typeof stays)[number]): BoardReservation => ({
    id: String(stay._id),
    guestName: (stay.guestId as unknown as { name?: string } | null)?.name ?? "",
    roomId: String(stay.roomId),
    roomNumber: roomById.get(String(stay.roomId))?.number ?? "",
    checkIn: iso(new Date(stay.checkIn)),
    checkOut: iso(new Date(stay.checkOut)),
    status: stay.status,
    nights: nightsBetween(new Date(stay.checkIn), new Date(stay.checkOut))
  });

  const dirtyRooms: BoardRoom[] = dirty.map((room) => ({ id: String(room._id), number: room.number, status: room.status }));

  const stats: Array<{ label: string; value: string; href: HotelHref }> = [
    ...(roomsOn ? [{ label: "In-house", value: `${inHouse.length}`, href: "/rooms" as const }] : []),
    ...(roomsOn ? [{ label: "Arrivals", value: `${arrivals.length}`, href: "/hotel" as const }] : []),
    ...(roomsOn ? [{ label: "Departures", value: `${departures.length}`, href: "/hotel" as const }] : []),
    ...(banquetOn ? [{ label: "Events (7d)", value: `${events.length}`, href: "/banquet" as const }] : [])
  ];

  const actions: Array<{ href: HotelHref; label: string }> = [
    { href: "/rooms", label: "New booking" },
    { href: "/rooms/setup", label: "Add rooms" },
    { href: "/housekeeping", label: "Housekeeping" },
    { href: "/hotel/maintenance", label: "Maintenance" },
    { href: "/hotel/rates", label: "Rates" },
    { href: "/hotel/reports", label: "Reports" },
    ...(banquetOn ? [{ href: "/banquet" as const, label: "Banquet" }] : [])
  ];

  return (
    <main className="section-shell">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Front desk</h1>
          <p className="text-sm text-text-muted">{iso(today)}</p>
        </div>
        <HotelTabs modules={modules} />
      </div>

      {roomsOn ? (
        <section className="surface-card p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-text-primary">Rooms</h2>
            <p className="text-xs text-text-muted">
              {counts.occupied} of {counts.total} occupied · {counts.occupancyPercent}%
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {(
              [
                ["Total", counts.total, "text-text-primary"],
                ["Occupied", counts.occupied, "text-amber-700"],
                ["Vacant", counts.vacant, "text-emerald-700"],
                ["Dirty", counts.dirty, "text-orange-700"],
                ["Maintenance", counts.maintenance, "text-rose-700"]
              ] as Array<[string, number, string]>
            ).map(([label, value, tone]) => (
              <div key={label} className="rounded-xl border border-border-subtle px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
                <p className={`mt-1 text-xl font-semibold tabular-nums ${tone}`}>{value}</p>
              </div>
            ))}
          </div>

          {floors.length ? (
            <div className="mt-4 space-y-2">
              {floors.map((group) => (
                <div key={group.floor} className="flex flex-wrap items-center gap-2">
                  <span className="w-14 shrink-0 text-xs text-text-muted">Floor {group.floor}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {group.rooms.map((room) => (
                      <Link
                        key={room.id}
                        href="/rooms"
                        title={`${room.number} · ${roomStateLabel[room.state]}`}
                        className={`rounded-lg border px-2 py-1 text-xs font-semibold tabular-nums transition hover:border-border-strong ${roomChipTone[room.state]}`}
                      >
                        {room.number}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-text-muted">No rooms yet</p>
          )}

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-muted">
            {(Object.keys(roomStateLabel) as RoomState[]).map((state) => (
              <span key={state} className="inline-flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${roomDotTone[state]}`} />
                {roomStateLabel[state]}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="surface-card p-3 transition hover:border-border-strong">
            <p className="text-xs uppercase tracking-wide text-text-muted">{stat.label}</p>
            <p className="mt-1 text-lg font-semibold text-text-primary">{stat.value}</p>
          </Link>
        ))}
      </section>

      <section className="mt-3 flex flex-wrap gap-2">
        {actions.map((action) => (
          <Link
            key={action.href + action.label}
            href={action.href}
            className="rounded-full border border-border-subtle bg-white px-3 py-1.5 text-sm font-medium text-text-secondary transition hover:border-border-strong hover:text-text-primary"
          >
            {action.label}
          </Link>
        ))}
      </section>
      {/* BOARD */}
      {roomsOn ? (
        <section className="mt-4">
          <FrontDeskBoard
            arrivals={arrivals.map(toBoard)}
            departures={departures.map(toBoard)}
            dirtyRooms={dirtyRooms}
          />
        </section>
      ) : null}

      {banquetOn ? (
        <section className="surface-card mt-4 p-4">
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
    </main>
  );
}
