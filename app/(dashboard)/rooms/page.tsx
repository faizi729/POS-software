import { redirect } from "next/navigation";

import { HotelTabs } from "@/components/hotel/hotel-tabs";
import { RoomsCalendar, type CalendarReservation, type CalendarRoom } from "@/components/hotel/rooms-calendar";
import { requireSession } from "@/lib/auth/guards";
import { connectToDatabase } from "@/lib/db/connect";
import { addDays, expireStaleHolds, toUtcDate } from "@/lib/hotel/availability";
import { hasModule } from "@/lib/modules";
import { Reservation, Restaurant, Room, RoomType } from "@/models";

export const dynamic = "force-dynamic";

const iso = (date: Date) => date.toISOString().slice(0, 10);

export default async function RoomsPage() {
  const session = await requireSession();
  await connectToDatabase();

  const restaurant = await Restaurant.findById(session.restaurantId)
    .select("enabledModules currency timezone")
    .lean();
  if (!hasModule(restaurant, "rooms")) redirect("/dashboard");

  await expireStaleHolds(session.restaurantId);

  const today = toUtcDate(new Date());

  const [roomsRaw, reservationsRaw, types] = await Promise.all([
    Room.find({ restaurantId: session.restaurantId }).sort({ floor: 1, number: 1 }).lean(),
    Reservation.find({
      restaurantId: session.restaurantId,
      status: { $ne: "cancelled" },
      checkIn: { $lt: addDays(today, 14) },
      checkOut: { $gt: today }
    })
      .populate({ path: "guestId", select: "name phone" })
      .lean(),
    RoomType.find({ restaurantId: session.restaurantId }).lean()
  ]);

  const typeById = new Map(types.map((type) => [String(type._id), type]));

  const rooms: CalendarRoom[] = roomsRaw.map((room) => {
    const type = typeById.get(String(room.roomTypeId));
    return {
      id: String(room._id),
      number: room.number,
      floor: room.floor ?? 1,
      status: room.status,
      roomTypeName: type?.name ?? "",
      baseRate: type?.baseRate ?? 0
    };
  });

  const roomById = new Map(rooms.map((room) => [room.id, room]));

  const reservations: CalendarReservation[] = reservationsRaw.map((reservation) => {
    const guest = reservation.guestId as unknown as { name?: string; phone?: string } | null;
    return {
      id: String(reservation._id),
      roomId: String(reservation.roomId),
      roomNumber: roomById.get(String(reservation.roomId))?.number ?? "",
      guestName: guest?.name ?? "",
      guestPhone: guest?.phone ?? "",
      checkIn: iso(new Date(reservation.checkIn)),
      checkOut: iso(new Date(reservation.checkOut)),
      status: reservation.status,
      rate: reservation.rateSnapshot ?? 0
    };
  });

  return (
    <main className="section-shell">
      <HotelTabs modules={(restaurant?.enabledModules ?? []) as string[]} />
      <RoomsCalendar
        rooms={rooms}
        reservations={reservations}
        currency={restaurant?.currency ?? "INR"}
        today={iso(today)}
      />
    </main>
  );
}
