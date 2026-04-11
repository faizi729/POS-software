import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/db/connect";
import { getSuperAdminSession } from "@/lib/auth/get-super-admin-session";
import { assertCanMutate } from "@/lib/auth/super-admin-permissions";
import { PlatformSetting } from "@/models/PlatformSetting";
import { AuditLog } from "@/models/AuditLog";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";

const PUBLIC_KEYS = [
  "platform_support_email",
  "default_trial_days",
  "maintenance_mode",
  "billing_company_legal_name",
  "billing_gstin"
] as const;

const patchSchema = z.object({
  platform_support_email: z.string().email().optional(),
  default_trial_days: z.number().int().min(0).max(90).optional(),
  maintenance_mode: z.boolean().optional(),
  billing_company_legal_name: z.string().max(200).optional(),
  billing_gstin: z.string().max(20).optional()
});

export async function GET(req: NextRequest) {
  await getSuperAdminSession();
  const rl = await rateLimit({
    request: req,
    keyParts: ["sa-settings-get", getClientIp(req)],
    limit: 120,
    windowMs: 60_000
  });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  await connectToDatabase();

  const keys = [...PUBLIC_KEYS];
  const docs = await PlatformSetting.find({ key: { $in: keys } }).lean();
  const map: Record<string, unknown> = {};
  for (const k of keys) {
    const d = docs.find((x: any) => x.key === k);
    map[k] = d ? (d as any).value : defaultsFor(k);
  }

  return NextResponse.json({ settings: map });
}

function defaultsFor(key: string): unknown {
  switch (key) {
    case "default_trial_days":
      return 14;
    case "maintenance_mode":
      return false;
    default:
      return "";
  }
}

export async function PATCH(req: NextRequest) {
  const sa = await getSuperAdminSession();
  try {
    assertCanMutate(sa, "global_settings");
  } catch (e: any) {
    if (e?.statusCode === 403) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }
  const rl = await rateLimit({
    request: req,
    keyParts: ["sa-settings-patch", getClientIp(req)],
    limit: 60,
    windowMs: 60_000
  });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  await connectToDatabase();

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const updates = Object.entries(parsed.data).filter(([, v]) => v !== undefined);
  for (const [key, value] of updates) {
    await PlatformSetting.findOneAndUpdate(
      { key },
      {
        $set: { key, value, updatedByPlatformUserId: sa.platformUserId },
        $setOnInsert: { description: key }
      },
      { upsert: true, new: true }
    );
  }

  await AuditLog.create({
    actorType: "platform",
    actorId: sa.platformUserId,
    actorEmail: sa.email,
    action: "platform.settings.update",
    targetType: "platform_settings",
    targetId: "global",
    meta: { keys: updates.map(([k]) => k) }
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
