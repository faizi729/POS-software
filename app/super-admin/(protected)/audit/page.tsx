import { connectToDatabase } from "@/lib/db/connect";
import { AuditLog } from "@/models/AuditLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SuperAdminAuditPage() {
  await connectToDatabase();
  const rows = await AuditLog.find({})
    .sort({ createdAt: -1 })
    .limit(150)
    .lean();

  return (
    <div className="space-y-6">
      <div>
        <p className="label-text">Compliance</p>
        <h1 className="mt-2 text-2xl font-extrabold text-text-primary">Audit log</h1>
        <p className="mt-2 text-sm text-text-secondary">Immutable trail of platform actions (latest 150).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Events</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted">
                <th className="py-2 pr-3 font-semibold">When</th>
                <th className="py-2 pr-3 font-semibold">Action</th>
                <th className="py-2 pr-3 font-semibold">Actor</th>
                <th className="py-2 pr-3 font-semibold">Target</th>
                <th className="py-2 font-semibold">Tenant</th>
              </tr>
            </thead>
            <tbody>
              {(rows as any[]).map((a) => (
                <tr key={a._id.toString()} className="border-b border-border-subtle align-top">
                  <td className="py-2 pr-3 text-xs text-text-muted whitespace-nowrap">
                    {a.createdAt?.toISOString?.()}
                  </td>
                  <td className="py-2 pr-3 font-semibold text-text-primary">{a.action}</td>
                  <td className="py-2 pr-3 text-text-secondary">{a.actorEmail || a.actorId}</td>
                  <td className="py-2 pr-3 text-text-secondary">
                    {a.targetType} / {a.targetId}
                  </td>
                  <td className="py-2 text-xs text-text-muted">{a.tenantId?.toString?.() ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
