import { Restaurant, User, Order, AuditLog, PlatformUser } from "@/models";
import { estimatedMrrInr } from "@/lib/super-admin/plan-catalog";

export async function loadSuperAdminDashboardPayload() {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    tenantTotal,
    tenantActive,
    tenantSuspended,
    platformUserCount,
    userCount,
    orderTotal,
    orders7d,
    orders30d,
    planAgg,
    subAgg,
    recentAudits
  ] = await Promise.all([
    Restaurant.countDocuments({}),
    Restaurant.countDocuments({ status: "active" }),
    Restaurant.countDocuments({ status: "suspended" }),
    PlatformUser.countDocuments({ status: "active" }),
    User.countDocuments({}),
    Order.countDocuments({}),
    Order.countDocuments({ createdAt: { $gte: since7d } }),
    Order.countDocuments({ createdAt: { $gte: since30d } }),
    Restaurant.aggregate([{ $group: { _id: "$plan", n: { $sum: 1 } } }]),
    Restaurant.aggregate([{ $group: { _id: "$subscriptionStatus", n: { $sum: 1 } } }]),
    AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .select({ action: 1, actorEmail: 1, targetType: 1, targetId: 1, tenantId: 1, createdAt: 1 })
      .lean()
  ]);

  const planCounts: Record<string, number> = {};
  for (const row of planAgg as any[]) {
    planCounts[String(row._id ?? "none")] = row.n;
  }

  const channelAgg = await Order.aggregate([
    { $match: { createdAt: { $gte: since30d } } },
    { $group: { _id: "$channel", n: { $sum: 1 } } }
  ]);
  const ordersByChannel: Record<string, number> = {};
  for (const row of channelAgg as any[]) {
    ordersByChannel[String(row._id || "pos")] = row.n;
  }

  return {
    tenants: {
      total: tenantTotal,
      active: tenantActive,
      suspended: tenantSuspended,
      byPlan: planCounts,
      bySubscriptionStatus: Object.fromEntries(
        (subAgg as any[]).map((r) => [String(r._id ?? "active"), r.n])
      )
    },
    users: { tenantUsers: userCount, platformUsers: platformUserCount },
    orders: { total: orderTotal, last7d: orders7d, last30d: orders30d, byChannel30d: ordersByChannel },
    revenue: { estimatedMrrInr: estimatedMrrInr(planCounts) },
    recentAudits: recentAudits.map((a: any) => ({
      id: a._id.toString(),
      action: a.action,
      actorEmail: a.actorEmail,
      targetType: a.targetType,
      targetId: a.targetId,
      tenantId: a.tenantId?.toString?.() ?? null,
      createdAt: a.createdAt?.toISOString?.()
    }))
  };
}
