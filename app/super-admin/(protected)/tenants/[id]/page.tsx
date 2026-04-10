import { redirect } from "next/navigation";
import { ArrowRight, Check, ShieldAlert } from "lucide-react";

import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models/Restaurant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function SuperAdminTenantDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectToDatabase();
  const tenant = await Restaurant.findById(id).lean();
  if (!tenant) redirect("/super-admin/tenants");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="label-text">Tenant</p>
            <CardTitle className="mt-2 text-xl">{(tenant as any).name}</CardTitle>
            <p className="mt-1 text-sm text-text-muted">{(tenant as any).slug}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={(tenant as any).status === "active" ? "success" : "warning"}>
                {(tenant as any).status}
              </Badge>
              <Badge>{(tenant as any).plan ?? "growth"}</Badge>
              <Badge variant={((tenant as any).features?.websiteSync ?? true) ? "success" : "danger"}>
                websiteSync
              </Badge>
              <Badge variant={((tenant as any).features?.aiFeatures ?? false) ? "success" : "neutral"}>
                aiFeatures
              </Badge>
            </div>
          </div>

          <form
            action="/api/super-admin/impersonate"
            method="post"
            className="rounded-2xl border border-border-subtle bg-bg-surface p-4"
          >
            <p className="text-sm font-semibold text-text-primary">Impersonate tenant</p>
            <p className="mt-1 text-sm">
              This will set a tenant `auth_token` as the owner user. Use only when needed.
            </p>
            <input type="hidden" name="tenantId" value={(tenant as any)._id.toString()} />
            <Button className="mt-3 w-full justify-between" size="lg" type="submit">
              <span className="flex w-full items-center justify-center gap-2">
                <span className="flex-1 text-center">Login as this tenant</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
            <p className="mt-2 flex items-start gap-2 text-xs text-text-muted">
              <ShieldAlert className="mt-0.5 size-4 text-warning" />
              Impersonation is logged in audit logs.
            </p>
          </form>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
            <p className="text-sm font-semibold text-text-primary">Feature flags</p>
            <p className="mt-1 text-sm">Controlled per tenant from Super Admin APIs.</p>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 text-success" />
                websiteSync: {String((tenant as any).features?.websiteSync ?? true)}
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 text-success" />
                aiFeatures: {String((tenant as any).features?.aiFeatures ?? false)}
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
            <p className="text-sm font-semibold text-text-primary">Operational</p>
            <p className="mt-1 text-sm">Status, plan, and compliance settings are stored on `Restaurant`.</p>
            <div className="mt-3 space-y-2 text-sm text-text-secondary">
              <p>
                <span className="font-semibold text-text-primary">GST enabled:</span>{" "}
                {String((tenant as any).settings?.gstEnabled ?? true)}
              </p>
              <p>
                <span className="font-semibold text-text-primary">Currency:</span>{" "}
                {(tenant as any).currency}
              </p>
              <p>
                <span className="font-semibold text-text-primary">Timezone:</span>{" "}
                {(tenant as any).timezone}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

