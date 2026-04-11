import Link from "next/link";
import { ArrowRight, Building2, IndianRupee, ShoppingBag, Users } from "lucide-react";

import { connectToDatabase } from "@/lib/db/connect";
import { loadSuperAdminDashboardPayload } from "@/lib/super-admin/dashboard-data";
import { formatPlanLabel } from "@/lib/super-admin/plan-label";
import { razorpayKeysPresent } from "@/lib/billing/razorpay-saas-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SuperAdminDashboardPage() {
  await connectToDatabase();
  const d = await loadSuperAdminDashboardPayload();
  const rz = razorpayKeysPresent();

  return (
    <div className="space-y-6">
      <div>
        <p className="label-text">Super Admin</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-text-primary sm:text-3xl">
          Platform dashboard
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Tenants, revenue estimate, order volume, and recent audit activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Building2} label="Tenants" value={String(d.tenants.total)} sub={`${d.tenants.active} active`} />
        <StatCard icon={Users} label="Users" value={String(d.users.tenantUsers)} sub={`${d.users.platformUsers} platform`} />
        <StatCard icon={ShoppingBag} label="Orders (30d)" value={String(d.orders.last30d)} sub={`${d.orders.last7d} last 7d`} />
        <StatCard
          icon={IndianRupee}
          label="Est. MRR (INR)"
          value={formatInr(d.revenue.estimatedMrrInr)}
          sub={
            rz
              ? "Catalog reference only — actual charges are in Razorpay"
              : "Starter + Growth × tenant count (reference)"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tenants by plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(d.tenants.byPlan).length === 0 ? (
              <p className="text-text-muted">No data.</p>
            ) : (
              Object.entries(d.tenants.byPlan).map(([k, v]) => (
                <div key={k} className="flex justify-between rounded-xl border border-border-subtle bg-bg-surface px-3 py-2">
                  <span className="font-semibold text-text-primary">{formatPlanLabel(k)}</span>
                  <span className="text-text-secondary">{v}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscription state</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(d.tenants.bySubscriptionStatus).map(([k, v]) => (
              <div key={k} className="flex justify-between rounded-xl border border-border-subtle bg-bg-surface px-3 py-2">
                <span className="font-semibold text-text-primary">{k}</span>
                <span className="text-text-secondary">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Orders by channel (30d)</CardTitle>
          <Link
            href="/super-admin/usage"
            className="inline-flex items-center gap-1 text-sm font-semibold text-accent-primary"
          >
            Usage <ArrowRight className="size-4" />
          </Link>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(d.orders.byChannel30d).map(([ch, n]) => (
            <span
              key={ch}
              className="rounded-full border border-border-subtle bg-bg-surface px-3 py-1 text-xs font-semibold text-text-secondary"
            >
              {ch}: <span className="text-text-primary">{n}</span>
            </span>
          ))}
          {Object.keys(d.orders.byChannel30d).length === 0 ? (
            <p className="text-sm text-text-muted">No orders in the last 30 days.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Recent audit events</CardTitle>
          <Link href="/super-admin/audit" className="text-sm font-semibold text-accent-primary">
            View all →
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {d.recentAudits.length === 0 ? (
            <p className="text-sm text-text-muted">No audit entries yet.</p>
          ) : (
            d.recentAudits.map((a) => (
              <div
                key={a.id}
                className="flex flex-col gap-0.5 rounded-xl border border-border-subtle bg-bg-surface px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-text-primary">{a.action}</p>
                  <p className="text-xs text-text-muted">
                    {a.actorEmail || a.targetType} · {a.targetId?.slice(0, 12)}…
                  </p>
                </div>
                <p className="text-xs text-text-muted">{a.createdAt}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="surface-card p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[rgba(15,118,110,0.10)] text-accent-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-[-0.03em] text-text-primary">{value}</p>
          <p className="text-sm font-semibold text-text-primary">{label}</p>
          <p className="text-xs text-text-muted">{sub}</p>
        </div>
      </div>
    </div>
  );
}

function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}
