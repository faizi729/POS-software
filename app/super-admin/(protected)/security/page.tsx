import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSuperAdminSession } from "@/lib/auth/get-super-admin-session";

const MATRIX: { role: string; tenant: string; impersonate: string; settings: string; platformUsers: string }[] = [
  { role: "super_admin", tenant: "Full", impersonate: "Yes", settings: "Yes", platformUsers: "Yes" },
  { role: "support", tenant: "Full", impersonate: "Yes", settings: "No", platformUsers: "No" },
  { role: "finance", tenant: "Full", impersonate: "No", settings: "No", platformUsers: "No" },
  { role: "read_only", tenant: "View", impersonate: "No", settings: "No", platformUsers: "No" }
];

export default async function SuperAdminSecurityPage({
  searchParams
}: {
  searchParams: Promise<{ forbidden?: string }>;
}) {
  const session = await getSuperAdminSession();
  const sp = await searchParams;

  return (
    <div className="space-y-6">
      {sp.forbidden === "impersonate" ? (
        <div className="rounded-2xl border border-[rgba(180,35,24,0.25)] bg-[rgba(180,35,24,0.08)] px-4 py-3 text-sm font-semibold text-danger">
          Your role cannot impersonate tenants (requires super_admin or support).
        </div>
      ) : null}
      <div>
        <p className="label-text">Access control</p>
        <h1 className="mt-2 text-2xl font-extrabold text-text-primary">Security & roles</h1>
        <p className="mt-2 text-sm text-text-secondary">
          You are signed in as <span className="font-semibold text-text-primary">{session.email}</span> (
          <span className="capitalize">{session.role.replace("_", " ")}</span>).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permission matrix</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted">
                <th className="py-2 pr-3 font-semibold">Role</th>
                <th className="py-2 pr-3 font-semibold">Tenant data</th>
                <th className="py-2 pr-3 font-semibold">Impersonate</th>
                <th className="py-2 pr-3 font-semibold">Global settings</th>
                <th className="py-2 font-semibold">Platform users</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((r) => (
                <tr key={r.role} className="border-b border-border-subtle">
                  <td className="py-2 pr-3 font-semibold capitalize text-text-primary">{r.role.replace("_", " ")}</td>
                  <td className="py-2 pr-3">{r.tenant}</td>
                  <td className="py-2 pr-3">{r.impersonate}</td>
                  <td className="py-2 pr-3">{r.settings}</td>
                  <td className="py-2">{r.platformUsers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operational notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-text-secondary">
          <p>• All super-admin routes require server-side session validation.</p>
          <p>• Use <code className="rounded bg-bg-surface px-1">scripts/create-super-admin.js</code> with SA_ROLE for new platform staff.</p>
          <p>• JWT cookie name: <code className="rounded bg-bg-surface px-1">sa_token</code> (httpOnly).</p>
        </CardContent>
      </Card>
    </div>
  );
}
