import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/connect";
import { getSuperAdminSession } from "@/lib/auth/get-super-admin-session";
import { AuditLog } from "@/models/AuditLog";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";

export async function GET(req: NextRequest) {
  await getSuperAdminSession();
  const rl = await rateLimit({
    request: req,
    keyParts: ["sa-audit", getClientIp(req)],
    limit: 90,
    windowMs: 60_000
  });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const tenantId = (searchParams.get("tenantId") || "").trim();
  const action = (searchParams.get("action") || "").trim();
  const limitRaw = Number(searchParams.get("limit") || 80);
  const limit = Math.max(1, Math.min(200, Number.isFinite(limitRaw) ? limitRaw : 80));

  const filter: any = {};
  if (tenantId && Types.ObjectId.isValid(tenantId)) filter.tenantId = new Types.ObjectId(tenantId);
  if (action) filter.action = new RegExp(action.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const rows = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({
    logs: rows.map((a: any) => ({
      id: a._id.toString(),
      actorType: a.actorType,
      actorId: a.actorId,
      actorEmail: a.actorEmail,
      action: a.action,
      targetType: a.targetType,
      targetId: a.targetId,
      tenantId: a.tenantId?.toString?.() ?? null,
      meta: a.meta,
      createdAt: a.createdAt?.toISOString?.()
    }))
  });
}
