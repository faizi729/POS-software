import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models";
import { hasUpstash, redisGet, redisSetEx } from "@/lib/redis/upstash";

const CACHE_TTL_SECONDS = 60 * 60; // 1h

export async function resolveRestaurantIdByPhoneNumberId(phoneNumberId: string): Promise<string | null> {
  const id = String(phoneNumberId || "").trim();
  if (!id) return null;

  const cacheKey = `wa:phoneNumberId:${id}`;
  if (hasUpstash()) {
    const cached = await redisGet(cacheKey);
    if (cached) return cached;
  }

  await connectToDatabase();
  const doc = await Restaurant.findOne({ "integrations.whatsapp.phoneNumberId": id })
    .select({ _id: 1 })
    .lean();
  const rid = doc?._id ? String(doc._id) : null;

  if (rid && hasUpstash()) {
    await redisSetEx(cacheKey, CACHE_TTL_SECONDS, rid);
  }

  return rid;
}

