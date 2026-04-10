import Link from "next/link";
import { Building2, FileText, ShieldCheck } from "lucide-react";

import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant, User, Order } from "@/models";

export default async function SuperAdminDashboardPage() {
  await connectToDatabase();

  const [tenantCount, activeTenantCount, userCount, orderCount] = await Promise.all([
    Restaurant.countDocuments({}),
    Restaurant.countDocuments({ status: "active" }),
    User.countDocuments({}),
    Order.countDocuments({})
  ]);

  return (
    <div className="space-y-6">
      <div className="surface-card p-6 md:p-8">
        <p className="label-text">Super Admin</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-text-primary">Platform dashboard</h1>
        <p className="mt-2 text-sm">
          Global visibility across tenants. Every action should be auditable and tenant-safe.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Stat label="Tenants" value={String(tenantCount)} />
          <Stat label="Active tenants" value={String(activeTenantCount)} />
          <Stat label="Users" value={String(userCount)} />
          <Stat label="Orders" value={String(orderCount)} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <QuickCard
          icon={Building2}
          title="Manage tenants"
          body="Plans, status, feature flags, and impersonation."
          href="/super-admin/tenants"
        />
        <QuickCard
          icon={ShieldCheck}
          title="RBAC and safety"
          body="All super-admin access is enforced server-side. Never trust client tenantId."
          href="/super-admin/tenants"
        />
        <QuickCard
          icon={FileText}
          title="Audit trail"
          body="Every platform change should be logged (who did what, when)."
          href="/super-admin/tenants"
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-surface px-4 py-4">
      <p className="text-2xl font-bold tracking-[-0.03em] text-text-primary">{value}</p>
      <p className="mt-1 text-sm">{label}</p>
    </div>
  );
}

function QuickCard({
  icon: Icon,
  title,
  body,
  href
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  href: "/super-admin/tenants";
}) {
  return (
    <Link href={href} className="surface-card group block p-6 transition hover:-translate-y-[1px] hover:shadow-soft">
      <div className="flex items-start gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-[rgba(15,118,110,0.10)] text-accent-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-base font-semibold text-text-primary">{title}</p>
          <p className="mt-1 text-sm">{body}</p>
          <p className="mt-3 text-sm font-semibold text-accent-primary">Open →</p>
        </div>
      </div>
    </Link>
  );
}

