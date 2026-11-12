import { redirect } from "next/navigation";

import { HotelTabs } from "@/components/hotel/hotel-tabs";
import { HousekeepingBoard, type BoardTask, type DirtyRoom } from "@/components/hotel/housekeeping-board";
import { requireSession } from "@/lib/auth/guards";
import { connectToDatabase } from "@/lib/db/connect";
import { hasModule } from "@/lib/modules";
import { HousekeepingTask, Restaurant, Room } from "@/models";

export const dynamic = "force-dynamic";

export default async function HousekeepingPage() {
  const session = await requireSession();
  await connectToDatabase();

  const restaurant = await Restaurant.findById(session.restaurantId).select("enabledModules").lean();
  if (!hasModule(restaurant, "rooms")) redirect("/dashboard");

  const [tasksRaw, rooms] = await Promise.all([
    HousekeepingTask.find({ restaurantId: session.restaurantId }).sort({ createdAt: -1 }).limit(100).lean(),
    Room.find({ restaurantId: session.restaurantId }).select("number status floor").sort({ number: 1 }).lean()
  ]);

  const roomById = new Map(rooms.map((room) => [String(room._id), room]));

  const tasks: BoardTask[] = tasksRaw.map((task) => ({
    id: String(task._id),
    roomNumber: roomById.get(String(task.roomId))?.number ?? "",
    roomStatus: roomById.get(String(task.roomId))?.status ?? "",
    status: task.status,
    assignee: task.assignee ?? "",
    note: task.note ?? "",
    createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : ""
  }));

  const dirtyRooms: DirtyRoom[] = rooms
    .filter((room) => room.status === "dirty")
    .map((room) => ({ id: String(room._id), number: room.number }));

  return (
    <main className="section-shell">
      <HotelTabs modules={(restaurant?.enabledModules ?? []) as string[]} />
      <HousekeepingBoard tasks={tasks} dirtyRooms={dirtyRooms} />
    </main>
  );
}
