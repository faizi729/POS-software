import type { NextRequest } from "next/server";
import { hasUpstash, redisExpire, redisIncr } from "@/lib/redis/upstash";

type Bucket = { hits: number[] };

// In-memory buckets (OK for dev/single instance). TODO: replace with Redis (Upstash) for production.
const buckets = new Map<string, Bucket>();

function now() {
  return Date.now();
}

export function getClientIp(request: NextRequest) {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export async function rateLimit(params: {
  request: NextRequest;
  keyParts: string[];
  limit: number;
  windowMs: number;
  onHit?: (meta: { key: string; count: number }) => void;
}) {
  const key = params.keyParts.filter(Boolean).join("|");
  const ts = now();

  // Production-grade: use Redis if configured (Upstash REST).
  // Fixed-window counter: key includes the window bucket.
  // TODO: upgrade to true sliding window using ZSET when needed.
  if (hasUpstash()) {
    const windowSec = Math.max(1, Math.ceil(params.windowMs / 1000));
    const bucket = Math.floor(ts / (windowSec * 1000));
    const redisKey = `rate:${key}:${bucket}`;
    const count = await redisIncr(redisKey);
    if (count === 1) {
      await redisExpire(redisKey, windowSec);
    }
    if (count > params.limit) {
      params.onHit?.({ key: redisKey, count });
      return { ok: false as const, remaining: 0, resetMs: params.windowMs };
    }
    return { ok: true as const, remaining: Math.max(0, params.limit - count), resetMs: params.windowMs };
  }

  const bucket = buckets.get(key) ?? { hits: [] };
  // sliding window prune
  const cutoff = ts - params.windowMs;
  bucket.hits = bucket.hits.filter((t) => t > cutoff);
  bucket.hits.push(ts);
  buckets.set(key, bucket);

  if (bucket.hits.length > params.limit) {
    params.onHit?.({ key, count: bucket.hits.length });
    return {
      ok: false as const,
      remaining: 0,
      resetMs: bucket.hits[0] ? bucket.hits[0] + params.windowMs - ts : params.windowMs
    };
  }

  return {
    ok: true as const,
    remaining: Math.max(0, params.limit - bucket.hits.length),
    resetMs: bucket.hits[0] ? bucket.hits[0] + params.windowMs - ts : params.windowMs
  };
}

