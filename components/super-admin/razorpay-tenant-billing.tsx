"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RazorpayTenantBilling({
  tenantId,
  razorpayConfigured,
  razorpayCustomerId,
  razorpaySubscriptionId,
  billingEmailPresent,
  saasBillingInterval
}: {
  tenantId: string;
  razorpayConfigured: boolean;
  razorpayCustomerId: string;
  razorpaySubscriptionId: string;
  billingEmailPresent: boolean;
  /** Current Razorpay plan period when subscribed. */
  saasBillingInterval?: string | null;
}) {
  const router = useRouter();
  const [planCode, setPlanCode] = useState<"starter" | "growth" | "scale">("starter");
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function createSub() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    const res = await fetch(`/api/super-admin/tenant/${tenantId}/razorpay/subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planCode, billingInterval })
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Failed");
      return;
    }
    setMsg(data.shortUrl ? `Created. Pay link: ${data.shortUrl}` : data.message || "Created.");
    router.refresh();
  }

  async function cancelSub(immediate: boolean) {
    setBusy(true);
    setMsg(null);
    setErr(null);
    const q = immediate ? "?immediate=1" : "";
    const res = await fetch(`/api/super-admin/tenant/${tenantId}/razorpay/subscription${q}`, {
      method: "DELETE"
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Failed");
      return;
    }
    setMsg(data.message || "OK");
    router.refresh();
  }

  if (!razorpayConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Razorpay subscription</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-text-muted">
          Set <code className="rounded bg-bg-surface px-1">RAZORPAY_KEY_ID</code> and{" "}
          <code className="rounded bg-bg-surface px-1">RAZORPAY_KEY_SECRET</code> plus plan IDs in{" "}
          <code className="rounded bg-bg-surface px-1">.env</code> (see env.example). Tenant checkout UI can be wired
          later.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Razorpay subscription</CardTitle>
        <p className="text-sm text-text-muted">
          Creates a Razorpay Subscription for this tenant. Webhooks update billing status automatically.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {err ? <p className="text-sm font-semibold text-danger">{err}</p> : null}
        {msg ? <p className="text-sm font-semibold text-success">{msg}</p> : null}

        <div className="rounded-xl border border-border-subtle bg-bg-surface px-3 py-2 text-sm">
          <p>
            <span className="font-semibold text-text-primary">Customer:</span>{" "}
            {razorpayCustomerId || "— (created on first subscribe)"}
          </p>
          <p className="mt-1">
            <span className="font-semibold text-text-primary">Subscription:</span> {razorpaySubscriptionId || "—"}
          </p>
          {razorpaySubscriptionId && saasBillingInterval ? (
            <p className="mt-1">
              <span className="font-semibold text-text-primary">Billing:</span> {saasBillingInterval}
            </p>
          ) : null}
        </div>

        {!billingEmailPresent ? (
          <p className="text-sm text-warning">
            Set billing email on the tenant before creating a subscription (or pass customerEmail via API).
          </p>
        ) : null}

        {!razorpaySubscriptionId ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-1">
              <span className="text-sm font-semibold text-text-primary">Plan</span>
              <select
                className="h-10 w-full min-w-[10rem] rounded-xl border border-border-subtle bg-white px-3 text-sm font-semibold sm:w-auto"
                value={planCode}
                onChange={(e) => setPlanCode(e.target.value as "starter" | "growth" | "scale")}
              >
                <option value="starter">starter</option>
                <option value="growth">growth</option>
                <option value="scale">scale</option>
              </select>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-semibold text-text-primary">Interval</span>
              <select
                className="h-10 w-full min-w-[10rem] rounded-xl border border-border-subtle bg-white px-3 text-sm font-semibold sm:w-auto"
                value={billingInterval}
                onChange={(e) => setBillingInterval(e.target.value as "monthly" | "yearly")}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <Button type="button" disabled={busy || !billingEmailPresent} onClick={() => void createSub()}>
              {busy ? "Working…" : "Create subscription"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void cancelSub(false)}>
              Cancel at period end
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void cancelSub(true)}>
              Cancel immediately
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
