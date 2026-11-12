import { redirect } from "next/navigation";

import { HotelTabs } from "@/components/hotel/hotel-tabs";
import { RoomSetup, type SetupRoom, type SetupRoomType } from "@/components/hotel/room-setup";
import { requireSession } from "@/lib/auth/guards";
import { connectToDatabase } from "@/lib/db/connect";
import { hasModule } from "@/lib/modules";
import { Restaurant, Room, RoomType } from "@/models";

export const dynamic = "force-dynamic";

export default async function RoomsSetupPage() {
  const session = await requireSession();
  await connectToDatabase();

  const restaurant = await Restaurant.findById(session.restaurantId)
    .select("enabledModules currency")
    .lean();
  if (!hasModule(restaurant, "rooms")) redirect("/dashboard");

  const [typesRaw, roomsRaw] = await Promise.all([
    RoomType.find({ restaurantId: session.restaurantId }).sort({ baseRate: 1 }).lean(),
    Room.find({ restaurantId: session.restaurantId }).sort({ floor: 1, number: 1 }).lean()
  ]);

  const types: SetupRoomType[] = typesRaw.map((type) => ({
    id: String(type._id),
    name: type.name,
    baseRate: type.baseRate,
    maxOccupancy: type.maxOccupancy ?? 2,
    gstPercent: type.gstPercent ?? 12
  }));

  const typeNameById = new Map(types.map((type) => [type.id, type.name]));

  const rooms: SetupRoom[] = roomsRaw.map((room) => ({
    id: String(room._id),
    number: room.number,
    floor: room.floor ?? 1,
    status: room.status,
    roomTypeId: String(room.roomTypeId),
    roomTypeName: typeNameById.get(String(room.roomTypeId)) ?? ""
  }));

  return (
    <main className="section-shell">
      <HotelTabs modules={(restaurant?.enabledModules ?? []) as string[]} />
      <RoomSetup types={types} rooms={rooms} />
    </main>
  );
}
