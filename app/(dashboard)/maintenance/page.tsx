import { redirect } from "next/navigation";

import { HotelTabs } from "@/components/hotel/hotel-tabs";
import { MaintenanceRow, MaintenanceScreen } from "@/components/hotel/maintenance-screen";
import { requireSession } from "@/lib/auth/guards";
import { connectToDatabase } from "@/lib/db/connect";
import { hasModule } from "@/lib/modules";
import { MaintenanceTicket, Restaurant, Room } from "@/models";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const session = await requireSession();
  await connectToDatabase();

  const restaurant = await Restaurant.findById(session.restaurantId).select("enabledModules").lean();
  if (!hasModule(restaurant, "rooms")) redirect("/dashboard");

  const [tickets, rooms] = await Promise.all([
    MaintenanceTicket.find({ restaurantId: session.restaurantId })
      .populate({ path: "roomId", select: "number" })
      .sort({ status: 1, createdAt: -1 })
      .limit(100)
      .lean(),
    Room.find({ restaurantId: session.restaurantId }).sort({ number: 1 }).select("number status").lean()
  ]);

  const rows: MaintenanceRow[] = tickets.map((ticket) => ({
    id: String(ticket._id),
    roomId: String(ticket.roomId?._id ?? ticket.roomId),
    roomNumber: (ticket.roomId as unknown as { number?: string } | null)?.number ?? "",
    title: ticket.title,
    description: ticket.description ?? "",
    priority: ticket.priority ?? "medium",
    status: ticket.status,
    assignee: ticket.assignee ?? "",
    openedAt: ticket.createdAt ? new Date(ticket.createdAt).toISOString() : ""
  }));

  return (
    <main className="section-shell">
      <HotelTabs modules={(restaurant?.enabledModules ?? []) as string[]} />
      <MaintenanceScreen
        tickets={rows}
        rooms={rooms.map((room) => ({ id: String(room._id), number: room.number, status: room.status }))}
      />
    </main>
  );
}
