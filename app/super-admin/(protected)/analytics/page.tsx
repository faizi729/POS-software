import Link from "next/link";
import { connectToDatabase } from "@/lib/db/connect";
import { Order, Restaurant } from "@/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SuperAdminAnalyticsPage() {
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
      { $limit: 12 },
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

  return (
    <div className="space-y-6">
      <div>
        <p className="label-text">Growth</p>
        <h1 className="mt-2 text-2xl font-extrabold text-text-primary">Analytics</h1>
        <p className="mt-2 text-sm text-text-secondary">This month: new tenants and order throughput.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New tenants (MTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-text-primary">{newTenantsThisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders (MTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-text-primary">{ordersThisMonth}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top tenants by orders (MTD)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(topTenants as any[]).map((t) => (
            <div key={t.tenantId} className="flex items-center justify-between rounded-xl border border-border-subtle px-3 py-2">
              <div>
                <p className="font-semibold text-text-primary">{t.name || "Unknown"}</p>
                <p className="text-xs text-text-muted">{t.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{t.orders} orders</span>
                <Link
                  href={`/super-admin/tenants/${t.tenantId}`}
                  className="text-sm font-semibold text-accent-primary"
                >
                  Open
                </Link>
              </div>
            </div>
          ))}
          {(topTenants as any[]).length === 0 ? <p className="text-sm text-text-muted">No data.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
