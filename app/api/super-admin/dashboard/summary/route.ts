import { NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db/connect";
import { getSuperAdminSession } from "@/lib/auth/get-super-admin-session";
import { loadSuperAdminDashboardPayload } from "@/lib/super-admin/dashboard-data";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";

export async function GET(req: NextRequest) {
  await getSuperAdminSession();
  const rl = await rateLimit({
    request: req,
    keyParts: ["sa-dash", getClientIp(req)],
    limit: 120,
    windowMs: 60_000
  });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  await connectToDatabase();

  const data = await loadSuperAdminDashboardPayload();
  return NextResponse.json({
    ...data,
    revenue: {
      ...data.revenue,
      note: "Static plan table × tenants on paid plans (Scale excluded)."
    }
  });
}
