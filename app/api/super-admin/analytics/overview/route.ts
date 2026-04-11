import { NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db/connect";
import { getSuperAdminSession } from "@/lib/auth/get-super-admin-session";
import { Order, Restaurant } from "@/models";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";

export async function GET(req: NextRequest) {
  await getSuperAdminSession();
  const rl = await rateLimit({
    request: req,
    keyParts: ["sa-analytics", getClientIp(req)],
    limit: 90,
    windowMs: 60_000
  });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  await connectToDatabase();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [newTenantsThisMonth, ordersThisMonth, topTenants] = await Promise.all([
    Restaurant.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: "$restaurantId", orders: { $sum: 1 } } },
      { $sort: { orders: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "restaurants",
          localField: "_id",
          foreignField: "_id",
          as: "r"
        }
      },
      { $unwind: { path: "$r", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          tenantId: { $toString: "$_id" },
          name: "$r.name",
          slug: "$r.slug",
          orders: 1
        }
      }
    ])
  ]);

  return NextResponse.json({
    period: { from: startOfMonth.toISOString(), to: now.toISOString() },
    newTenantsThisMonth,
    ordersThisMonth,
    topTenantsByOrders: topTenants
  });
}
