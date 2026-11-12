import { availableRoomIds, addDays, toUtcDate } from "@/lib/hotel/availability";
import { quoteStay } from "@/lib/hotel/rates";
import { loadHotelSettings, type HotelSettings } from "@/lib/hotel/booking";
import { hasModule, enabledModulesOf } from "@/lib/modules";
import { Reservation, Restaurant, Room, RoomType } from "@/models";

export type PublicTenant = {
  restaurantId: string;
  name: string;
  slug: string;
  roomsEnabled: boolean;
  banquetEnabled: boolean;
  settings: HotelSettings;
  timezone: string;
};

/** Resolves a public booking page. Returns null for unknown/disabled tenants. */
export async function resolvePublicTenant(slug: string): Promise<PublicTenant | null> {
  const clean = (slug || "").trim().toLowerCase();
  if (!clean) return null;

  const restaurant = await Restaurant.findOne({ slug: clean })
    .select("name slug enabledModules settings timezone")
    .lean();
  if (!restaurant) return null;

  const modules = enabledModulesOf(restaurant as any);
  const roomsEnabled = hasModule(restaurant as any, "rooms");
  if (!roomsEnabled) return null;
  if ((restaurant as any).settings?.publicBookingEnabled === false) return null;

  const settings = await loadHotelSettings(String(restaurant._id));
  return {
    restaurantId: String(restaurant._id),
    name: restaurant.name,
    slug: restaurant.slug,
    roomsEnabled,
    banquetEnabled: modules.includes("banquet"),
    settings,
    timezone: (restaurant as any).timezone || "Asia/Kolkata"
  };
}

export type PublicRoomType = {
  id: string;
  name: string;
  maxOccupancy: number;
  amenities: string[];
  nightlyRate: number;
  total: number;
  tax: number;
  roomsLeft: number;
};

/** Room types that can host the whole stay, priced night by night. */
export async function publicAvailability(params: {
  tenant: PublicTenant;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  discountCode?: string;
}): Promise<PublicRoomType[]> {
  const { tenant } = params;
  const busy = await availableRoomIds({
    restaurantId: tenant.restaurantId,
    checkIn: params.checkIn,
    checkOut: params.checkOut
  });

  const [types, rooms] = await Promise.all([
    RoomType.find({ restaurantId: tenant.restaurantId }).lean(),
    Room.find({ restaurantId: tenant.restaurantId, status: { $ne: "maintenance" } })
      .select("roomTypeId")
      .lean()
  ]);

  const freeByType = new Map<string, number>();
  for (const room of rooms) {
    if (busy.has(String(room._id))) continue;
    const key = String(room.roomTypeId);
    freeByType.set(key, (freeByType.get(key) ?? 0) + 1);
  }

  const out: PublicRoomType[] = [];
  for (const type of types) {
    const left = freeByType.get(String(type._id)) ?? 0;
    if (left <= 0) continue;
    if ((type.maxOccupancy ?? 2) < params.adults) continue;

    const quote = await quoteStay({
      restaurantId: tenant.restaurantId,
      roomTypeId: String(type._id),
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      adults: params.adults,
      children: params.children,
      discountCode: params.discountCode,
      slabs: tenant.settings.slabs
    });

    out.push({
      id: String(type._id),
      name: type.name,
      maxOccupancy: type.maxOccupancy ?? 2,
      amenities: type.amenities ?? [],
      nightlyRate: quote.nightlyFromPaise / 100,
      total: (quote.totalPaise + quote.taxPaise) / 100,
      tax: quote.taxPaise / 100,
      roomsLeft: left
    });
  }

  return out.sort((a, b) => a.total - b.total);
}

/** First free room of a type (public bookings don't choose a room number). */
export async function pickRoom(restaurantId: string, roomTypeId: string, checkIn: Date, checkOut: Date) {
  const busy = await availableRoomIds({ restaurantId, checkIn, checkOut });
  const rooms = await Room.find({ restaurantId, roomTypeId, status: { $ne: "maintenance" } })
    .sort({ number: 1 })
    .lean();
  return rooms.find((room) => !busy.has(String(room._id))) ?? null;
}

/** Days the public page offers (keeps request scope bounded). */
export function publicDateWindow() {
  const today = toUtcDate(new Date());
  return { from: today, to: addDays(today, 180) };
}

/** Prevent a tenant from leaking other tenants' reservation ids on the public API. */
export async function reservationBelongsToTenant(restaurantId: string, reservationId: string) {
  const row = await Reservation.findOne({ _id: reservationId, restaurantId }).select("_id").lean();
  return Boolean(row);
}
