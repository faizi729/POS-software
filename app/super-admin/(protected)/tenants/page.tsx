import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models/Restaurant";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function SuperAdminTenantsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; plan?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const status = sp.status || "";
  const plan = sp.plan || "";

  await connectToDatabase();
  const filter: any = {};
  if (q) filter.$or = [{ name: new RegExp(q, "i") }, { slug: new RegExp(q, "i") }];
  if (status === "active" || status === "suspended") filter.status = status;
  if (plan === "starter" || plan === "growth" || plan === "scale") filter.plan = plan;

  const tenants = await Restaurant.find(filter).sort({ createdAt: -1 }).limit(200).lean();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label-text">Tenants</p>
            <CardTitle className="mt-2 text-xl">Restaurants / workspaces</CardTitle>
            <p className="mt-1 text-sm">Activate/suspend, plans, feature flags, and impersonation.</p>
          </div>
          <Link
            href="/super-admin/tenants/new"
            className="inline-flex items-center gap-2 rounded-xl bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-primary-hover"
          >
            <Plus className="size-4" />
            New tenant
          </Link>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
              <Input name="q" defaultValue={q} className="pl-10" placeholder="Search by name or slug..." />
            </div>
            <select
              name="status"
              defaultValue={status}
              className="h-10 rounded-xl border border-border-subtle bg-white px-3 text-sm text-text-primary"
            >
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <select
              name="plan"
              defaultValue={plan}
              className="h-10 rounded-xl border border-border-subtle bg-white px-3 text-sm text-text-primary"
            >
              <option value="">All plans</option>
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="scale">Scale</option>
            </select>
          </form>

          <div className="mt-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((t: any) => (
                  <TableRow key={t._id.toString()}>
                    <TableCell className="text-text-primary">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-text-primary">{t.name}</p>
                        <p className="text-xs text-text-muted">{t.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.status === "active" ? "success" : "warning"}>{t.status}</Badge>
                    </TableCell>
                    <TableCell className="text-text-primary font-semibold">{t.plan ?? "growth"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={(t.features?.websiteSync ?? true) ? "success" : "danger"}>websiteSync</Badge>
                        <Badge variant={(t.features?.aiFeatures ?? false) ? "success" : "neutral"}>aiFeatures</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/super-admin/tenants/${t._id.toString()}`}
                          className="rounded-xl border border-border-subtle bg-bg-surface px-3 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:bg-white"
                        >
                          View
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {tenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-text-muted">
                      No tenants found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

