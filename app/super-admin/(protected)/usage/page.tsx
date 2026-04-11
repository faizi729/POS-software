import { connectToDatabase } from "@/lib/db/connect";
import { Order } from "@/models/Order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SuperAdminUsagePage() {
  await connectToDatabase();
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [byChannel, byDay] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: since30d } } },
      { $group: { _id: "$channel", n: { $sum: 1 } } }
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: since30d } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          n: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="label-text">Metering</p>
        <h1 className="mt-2 text-2xl font-extrabold text-text-primary">Usage</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Order volume by channel (30 days). Extend with <code className="rounded bg-bg-surface px-1">UsageEvent</code>{" "}
          collection for WhatsApp API calls and overage billing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orders by channel (30d)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(byChannel as any[]).map((r) => (
            <div key={String(r._id)} className="flex justify-between rounded-xl border border-border-subtle px-3 py-2">
              <span className="font-semibold capitalize">{String(r._id || "pos")}</span>
              <span>{r.n}</span>
            </div>
          ))}
          {(byChannel as any[]).length === 0 ? <p className="text-sm text-text-muted">No orders.</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orders by day (30d)</CardTitle>
        </CardHeader>
        <CardContent className="max-h-80 space-y-1 overflow-y-auto text-sm">
          {(byDay as any[]).map((r) => (
            <div key={r._id} className="flex justify-between border-b border-border-subtle py-1">
              <span className="text-text-muted">{r._id}</span>
              <span className="font-semibold">{r.n}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
