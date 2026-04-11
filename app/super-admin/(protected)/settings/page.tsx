import { connectToDatabase } from "@/lib/db/connect";
import { getSuperAdminSession } from "@/lib/auth/get-super-admin-session";
import { PlatformSetting } from "@/models/PlatformSetting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlobalSettingsForm } from "@/components/super-admin/global-settings-form";

const KEYS = [
  "platform_support_email",
  "default_trial_days",
  "maintenance_mode",
  "billing_company_legal_name",
  "billing_gstin"
] as const;

function defaultsFor(key: string): unknown {
  if (key === "default_trial_days") return 14;
  if (key === "maintenance_mode") return false;
  return "";
}

export default async function SuperAdminSettingsPage() {
  const session = await getSuperAdminSession();
  await connectToDatabase();

  const docs = await PlatformSetting.find({ key: { $in: [...KEYS] } }).lean();
  const map: Record<string, unknown> = {};
  for (const k of KEYS) {
    const d = docs.find((x: any) => x.key === k);
    map[k] = d ? (d as any).value : defaultsFor(k);
  }

  const canEdit = session.role === "super_admin";

  return (
    <div className="space-y-6">
      <div>
        <p className="label-text">Platform</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-text-primary">Global settings</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Cross-tenant configuration stored in <code className="rounded bg-bg-surface px-1">PlatformSetting</code>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <GlobalSettingsForm initial={map} canEdit={canEdit} />
        </CardContent>
      </Card>
    </div>
  );
}
