import { connectToDatabase } from "@/lib/db/connect";
import { AuditLog } from "@/models/AuditLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SuperAdminMonitoringPage() {
  await connectToDatabase();
  const failures = await AuditLog.find({ action: /fail|error/i })
    .sort({ createdAt: -1 })
    .limit(25)
    .lean()
    .catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <p className="label-text">Reliability</p>
        <h1 className="mt-2 text-2xl font-extrabold text-text-primary">Monitoring</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Hook Sentry / OpenTelemetry for real APM. This panel shows audit entries matching fail/error (lightweight
          stand-in).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent “failure” audit matches</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(failures as any[]).length === 0 ? (
            <p className="text-text-muted">No matching audit rows. Add structured logging for job failures.</p>
          ) : (
            (failures as any[]).map((a) => (
              <div key={a._id.toString()} className="rounded-xl border border-border-subtle px-3 py-2">
                <p className="font-semibold">{a.action}</p>
                <p className="text-xs text-text-muted">{a.createdAt?.toISOString?.()}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
