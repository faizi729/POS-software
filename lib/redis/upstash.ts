type UpstashConfig = {
  url: string;
  token: string;
};

function getUpstashConfig(): UpstashConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || "";
  if (!url || !token) return null;
  return { url, token };
}

async function callUpstash(cmd: unknown[]) {
  const cfg = getUpstashConfig();
  if (!cfg) throw new Error("Upstash Redis not configured");
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(`Upstash error (${res.status}): ${json?.error ?? "unknown"}`);
  }
  return json?.result;
}

export function hasUpstash() {
  return Boolean(getUpstashConfig());
}

export async function redisGet(key: string): Promise<string | null> {
  const v = await callUpstash(["GET", key]);
  return v == null ? null : String(v);
}

export async function redisSetEx(key: string, ttlSeconds: number, value: string) {
  await callUpstash(["SETEX", key, String(ttlSeconds), value]);
}

export async function redisIncr(key: string): Promise<number> {
  const v = await callUpstash(["INCR", key]);
  return Number(v || 0);
}

export async function redisExpire(key: string, ttlSeconds: number) {
  await callUpstash(["EXPIRE", key, String(ttlSeconds)]);
}

