import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldAlert } from "lucide-react";

import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models/Restaurant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TenantAdminPanel, type TenantAdminPanelInitial } from "@/components/super-admin/tenant-admin-panel";
import { RazorpayTenantBilling } from "@/components/super-admin/razorpay-tenant-billing";
import { razorpayKeysPresent } from "@/lib/billing/razorpay-saas-config";

const IMPERSONATE_MSG: Record<string, string> = {
  notfound: "Tenant not found.",
  no_owner: "No active owner user for this tenant — create an owner in the restaurant first.",
  invalid: "Invalid impersonation request."
};

export default async function SuperAdminTenantDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ impersonate?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const impersonateErr = sp.impersonate ? IMPERSONATE_MSG[sp.impersonate] ?? null : null;
  await connectToDatabase();
  const tenant = await Restaurant.findById(id).lean();
  if (!tenant) redirect("/super-admin/tenants");

  const tx = tenant as any;
  const initial: TenantAdminPanelInitial = {
    id: tx._id.toString(),
    name: tx.name,
    slug: tx.slug,
    status: tx.status,
    plan: tx.plan ?? "none",
    subscriptionStatus: tx.subscriptionStatus ?? "active",
    trialEndsAt: tx.trialEndsAt ? new Date(tx.trialEndsAt).toISOString() : null,
    billingEmail: tx.billingEmail ?? "",
    notesInternal: tx.notesInternal ?? "",
    features: {
      websiteSync: tx.features?.websiteSync ?? true,
      aiFeatures: tx.features?.aiFeatures ?? false,
      whatsappOrdering: tx.features?.whatsappOrdering ?? true,
      qrOrdering: tx.features?.qrOrdering ?? true
    }
  };

  return (
    <div className="space-y-6">
      {impersonateErr ? (
        <div className="rounded-2xl border border-[rgba(180,35,24,0.25)] bg-[rgba(180,35,24,0.08)] px-4 py-3 text-sm font-semibold text-danger">
          {impersonateErr}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/super-admin/tenants"
          className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface px-3 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:bg-white"
        >
          <ArrowLeft className="size-4" />
          Tenants
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="label-text">Tenant</p>
            <CardTitle className="mt-2 text-xl">{tx.name}</CardTitle>
            <p className="mt-1 text-sm text-text-muted">{tx.slug}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={tx.status === "active" ? "success" : "warning"}>{tx.status}</Badge>
              <Badge>{tx.plan === "none" || !tx.plan ? "Unassigned" : tx.plan}</Badge>
              <Badge variant="neutral">{initial.subscriptionStatus}</Badge>
            </div>
          </div>

          <form
            action="/api/super-admin/impersonate"
            method="post"
            className="w-full max-w-sm rounded-2xl border border-border-subtle bg-bg-surface p-4"
          >
            <p className="text-sm font-semibold text-text-primary">Impersonate tenant</p>
            <p className="mt-1 text-sm text-text-secondary">
              Sets tenant session as the owner user. Logged in audit trail.
            </p>
            <input type="hidden" name="tenantId" value={tx._id.toString()} />
            <Button className="mt-3 w-full justify-between" size="lg" type="submit">
              <span className="flex w-full items-center justify-center gap-2">
                <span className="flex-1 text-center">Open as tenant</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
            <p className="mt-2 flex items-start gap-2 text-xs text-text-muted">
              <ShieldAlert className="mt-0.5 size-4 text-warning" />
              Requires support or super_admin role.
            </p>
          </form>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-text-secondary sm:grid-cols-2">
          <p>
            <span className="font-semibold text-text-primary">Timezone:</span> {tx.timezone}
          </p>
          <p>
            <span className="font-semibold text-text-primary">Currency:</span> {tx.currency}
          </p>
          {tx.subdomain ? (
            <p>
              <span className="font-semibold text-text-primary">Subdomain:</span> {tx.subdomain}
            </p>
          ) : null}
          {tx.customDomain ? (
            <p>
              <span className="font-semibold text-text-primary">Domain:</span> {tx.customDomain}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <TenantAdminPanel initial={initial} />

      <RazorpayTenantBilling
        tenantId={tx._id.toString()}
        razorpayConfigured={razorpayKeysPresent()}
        razorpayCustomerId={tx.razorpayCustomerId ?? ""}
        razorpaySubscriptionId={tx.razorpaySubscriptionId ?? ""}
        billingEmailPresent={Boolean((tx.billingEmail || tx.contact?.email || "").toString().trim())}
        saasBillingInterval={tx.saasBillingInterval ?? null}
      />
    </div>
  );
}
