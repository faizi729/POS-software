"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt?: string;
};

export function PlatformUsersSection({
  users,
  roles,
  canCreate
}: {
  users: UserRow[];
  roles: string[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("support");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate) return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/super-admin/platform-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password, role })
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Failed");
      return;
    }
    setEmail("");
    setName("");
    setPassword("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {canCreate ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite platform user</CardTitle>
            <p className="text-sm text-text-muted">Password min 12 characters. User can sign in at /super-admin/login.</p>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-2" onSubmit={(e) => void createUser(e)}>
              {err ? <p className="md:col-span-2 text-sm text-danger">{err}</p> : null}
              <Input placeholder="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input placeholder="Full name" required value={name} onChange={(e) => setName(e.target.value)} />
              <Input
                placeholder="Temp password (12+ chars)"
                type="password"
                required
                minLength={12}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <select
                className="h-10 rounded-xl border border-border-subtle bg-white px-3 text-sm font-semibold"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <div className="md:col-span-2">
                <Button type="submit" disabled={busy}>
                  {busy ? "Creating…" : "Create user"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-text-muted">Only super_admin can create platform users.</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All platform users</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted">
                <th className="py-2 pr-3 font-semibold">Email</th>
                <th className="py-2 pr-3 font-semibold">Name</th>
                <th className="py-2 pr-3 font-semibold">Role</th>
                <th className="py-2 pr-3 font-semibold">Status</th>
                <th className="py-2 font-semibold">Last login</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border-subtle">
                  <td className="py-2 pr-3 font-medium text-text-primary">{u.email}</td>
                  <td className="py-2 pr-3">{u.name}</td>
                  <td className="py-2 pr-3 capitalize">{u.role.replace("_", " ")}</td>
                  <td className="py-2 pr-3">{u.status}</td>
                  <td className="py-2 text-xs text-text-muted">{u.lastLoginAt || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
