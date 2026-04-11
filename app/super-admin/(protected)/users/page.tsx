import { connectToDatabase } from "@/lib/db/connect";
import { getSuperAdminSession } from "@/lib/auth/get-super-admin-session";
import { PlatformUser } from "@/models/PlatformUser";
import { PLATFORM_ROLES } from "@/lib/auth/platform-role";
import { PlatformUsersSection } from "@/components/super-admin/platform-users-section";

export default async function SuperAdminUsersPage() {
  const session = await getSuperAdminSession();
  await connectToDatabase();

  const users = await PlatformUser.find({})
    .select({ email: 1, name: 1, role: 1, status: 1, lastLoginAt: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .lean();

  const rows = users.map((u: any) => ({
    id: u._id.toString(),
    email: u.email,
    name: u.name,
    role: u.role,
    status: u.status,
    lastLoginAt: u.lastLoginAt?.toISOString?.() ?? null,
    createdAt: u.createdAt?.toISOString?.()
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="label-text">Team</p>
        <h1 className="mt-2 text-2xl font-extrabold text-text-primary">Platform users</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Staff who can access this control plane (separate from restaurant staff).
        </p>
      </div>

      <PlatformUsersSection users={rows} roles={[...PLATFORM_ROLES]} canCreate={session.role === "super_admin"} />
    </div>
  );
}
