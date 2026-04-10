export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  // Public wrapper for /super-admin routes (login is public).
  // Protected pages live under /super-admin/(protected) and are gated there.
  return children;
}
