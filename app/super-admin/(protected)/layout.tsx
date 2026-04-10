import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Building2, LayoutGrid, LogOut, Settings2, Users } from "lucide-react";

import { getSuperAdminSession } from "@/lib/auth/get-super-admin-session";
import { SuperAdminSideLink } from "@/components/super-admin/super-admin-side-link";

export default async function SuperAdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSuperAdminSession().catch(() => null);
  if (!session) redirect("/super-admin/login");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-[rgba(255,253,249,0.82)] backdrop-blur supports-[backdrop-filter]:bg-[rgba(255,253,249,0.72)]">
        <div className="section-shell py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl border border-border-subtle bg-bg-elevated shadow-soft">
                <Image src="/logo.png" alt="Rasoio" width={22} height={22} className="select-none" priority />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-text-primary">Super Admin</p>
                <p className="text-xs text-text-muted">{session.email}</p>
              </div>
            </div>
            <form action="/api/super-admin/auth/logout" method="post">
              <button className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface px-3 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:bg-white">
                <LogOut className="size-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="section-shell py-6 md:py-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="surface-card h-fit p-3">
            <nav className="flex flex-col gap-1">
              <SuperAdminSideLink href="/super-admin" icon={LayoutGrid} label="Dashboard" />
              <SuperAdminSideLink href="/super-admin/tenants" icon={Building2} label="Tenants" />
              <SuperAdminSideLink href="/super-admin/users" icon={Users} label="Users" />
            </nav>
          </aside>
          <section>{children}</section>
        </div>
      </div>
    </div>
  );
}

