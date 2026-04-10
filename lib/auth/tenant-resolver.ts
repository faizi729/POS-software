import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models";
import { hasUpstash, redisGet, redisSetEx } from "@/lib/redis/upstash";

const TTL_SECONDS = 60 * 10; // 10m

export async function resolveRestaurantIdBySlug(slug: string): Promise<string | null> {
  const s = String(slug || "").trim().toLowerCase();
  if (!s) return null;
  const cacheKey = `tenant:slug:${s}`;
  if (hasUpstash()) {
    const cached = await redisGet(cacheKey);
    if (cached) return cached;
  }
  await connectToDatabase();
  const doc = await Restaurant.findOne({ $or: [{ slug: s }, { subdomain: s }] }).select({ _id: 1 }).lean();
  const rid = doc?._id ? String(doc._id) : null;
  if (rid && hasUpstash()) {
    await redisSetEx(cacheKey, TTL_SECONDS, rid);
  }
  return rid;
}

export async function resolveRestaurantIdByHost(host: string): Promise<string | null> {
  const h = String(host || "").trim().toLowerCase();
  if (!h) return null;
  const cacheKey = `tenant:host:${h}`;
  if (hasUpstash()) {
    const cached = await redisGet(cacheKey);
    if (cached) return cached;
  }
  await connectToDatabase();
  const doc = await Restaurant.findOne({ customDomain: h }).select({ _id: 1 }).lean();
  const rid = doc?._id ? String(doc._id) : null;
  if (rid && hasUpstash()) {
    await redisSetEx(cacheKey, TTL_SECONDS, rid);
  }
  return rid;
}

export async function resolveRestaurantPublicConfigById(restaurantId: string) {
  await connectToDatabase();
  const doc = await Restaurant.findById(restaurantId)
    .select({
      _id: 1,
      name: 1,
      slug: 1,
      subdomain: 1,
      customDomain: 1,
      logoUrl: 1,
      theme: 1,
      timezone: 1,
      currency: 1,
      status: 1
    })
    .lean();

  if (!doc?._id) return null;

  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    subdomain: doc.subdomain ?? "",
    customDomain: doc.customDomain ?? "",
    logoUrl: doc.logoUrl ?? "",
    theme: doc.theme ?? {},
    timezone: doc.timezone,
    currency: doc.currency,
    status: doc.status
  };
}
