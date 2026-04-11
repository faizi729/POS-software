import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminIntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="label-text">Connections</p>
        <h1 className="mt-2 text-2xl font-extrabold text-text-primary">Integrations</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Tenant-level WhatsApp and payments are stored on each restaurant. Platform-wide secrets belong in environment
          variables and optional <code className="rounded bg-bg-surface px-1">PlatformSetting</code> (encrypted at rest in
          production).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Environment variables (typical)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-text-secondary">
          <div className="rounded-xl border border-border-subtle bg-bg-surface p-3">
            <p className="font-semibold text-text-primary">Payments</p>
            <p className="mt-1">Razorpay / Stripe keys for platform billing; map to tenant sub-merchants when needed.</p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-bg-surface p-3">
            <p className="font-semibold text-text-primary">WhatsApp (Meta)</p>
            <p className="mt-1">System user token, webhook verify token, app credentials — often per-tenant in your model.</p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-bg-surface p-3">
            <p className="font-semibold text-text-primary">Email / SMS</p>
            <p className="mt-1">Resend, SES, or MSG91 for dunning and alerts.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
