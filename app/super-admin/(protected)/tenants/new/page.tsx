import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getSuperAdminSession } from "@/lib/auth/get-super-admin-session";
import { canMutate } from "@/lib/auth/super-admin-permissions";
import { NewTenantForm } from "@/components/super-admin/new-tenant-form";

export const dynamic = "force-dynamic";

export default async function NewTenantPage() {
  const sa = await getSuperAdminSession();
  const canWrite = canMutate(sa, "tenant_write");
  const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/super-admin/tenants"
          className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface px-3 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:bg-white"
        >
          <ArrowLeft className="size-4" />
          Tenants
        </Link>
      </div>

      <NewTenantForm canWrite={canWrite} defaultTimezone={defaultTimezone} />
    </div>
  );
}
