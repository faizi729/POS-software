"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export type TenantAdminPanelInitial = {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  billingEmail: string;
  notesInternal: string;
  enabledModules: string[];
  features: {
    websiteSync: boolean;
    aiFeatures: boolean;
    whatsappOrdering: boolean;
    qrOrdering: boolean;
  };
};

function Toggle({
  checked,
  onChange,
  label,
  disabled
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg-surface px-3 py-2.5">
      <span className="text-sm font-semibold text-text-primary">{label}</span>
      <input
        type="checkbox"
        className="size-4 accent-accent-primary"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function TenantAdminPanel({ initial }: { initial: TenantAdminPanelInitial }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [name, setName] = useState(initial.name);
  const [status, setStatus] = useState(initial.status);
  const [plan, setPlan] = useState(initial.plan);
  const [subscriptionStatus, setSubscriptionStatus] = useState(initial.subscriptionStatus);
  const [trialEndsAt, setTrialEndsAt] = useState(
    initial.trialEndsAt ? initial.trialEndsAt.slice(0, 16) : ""
  );
  const [billingEmail, setBillingEmail] = useState(initial.billingEmail);
  const [notesInternal, setNotesInternal] = useState(initial.notesInternal);
  const [enabledModules, setEnabledModules] = useState<string[]>(initial.enabledModules ?? ["pos"]);
  const [features, setFeatures] = useState(initial.features);

  async function save() {
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch(`/api/super-admin/tenant/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          status,
          plan,
          subscriptionStatus,
          trialEndsAt: trialEndsAt || null,
          billingEmail,
          notesInternal,
          enabledModules: enabledModules.length ? enabledModules : ["pos"],
          features
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Save failed");
        return;
      }
      setOk("Saved.");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tenant controls</CardTitle>
        <p className="text-sm text-text-muted">Operational status, plan, billing state, and feature flags.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
        {ok ? <p className="text-sm font-semibold text-success">{ok}</p> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="sa-name" className="text-sm font-semibold text-text-primary">
              Name
            </label>
            <Input id="sa-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-semibold text-text-primary">Slug</span>
            <Input value={initial.slug} disabled className="bg-bg-surface" />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-semibold text-text-primary">Operational status</span>
            <select
              className={cn(
                "h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm font-semibold text-text-primary"
              )}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">active</option>
              <option value="suspended">suspended</option>
            </select>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-semibold text-text-primary">Plan</span>
            <select
              className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm font-semibold text-text-primary"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
            >
              <option value="none">Unassigned (no tier)</option>
              <option value="starter">starter</option>
              <option value="growth">growth</option>
              <option value="scale">scale</option>
            </select>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-semibold text-text-primary">Subscription status</span>
            <select
              className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm font-semibold text-text-primary"
              value={subscriptionStatus}
              onChange={(e) => setSubscriptionStatus(e.target.value)}
            >
              <option value="trial">trial</option>
              <option value="active">active</option>
              <option value="past_due">past_due</option>
              <option value="suspended">suspended</option>
              <option value="churned">churned</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="sa-trial" className="text-sm font-semibold text-text-primary">
              Trial ends (local)
            </label>
            <Input
              id="sa-trial"
              type="datetime-local"
              value={trialEndsAt}
              onChange={(e) => setTrialEndsAt(e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="sa-bill-email" className="text-sm font-semibold text-text-primary">
              Billing email
            </label>
            <Input
              id="sa-bill-email"
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              placeholder="finance@restaurant.com"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="sa-notes" className="text-sm font-semibold text-text-primary">
              Internal notes (platform only)
            </label>
            <textarea
              id="sa-notes"
              className="min-h-[88px] w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-text-primary"
              value={notesInternal}
              onChange={(e) => setNotesInternal(e.target.value)}
              placeholder="Contract refs, risk flags, onboarding notes…"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-text-primary">Modules</p>
          <div className="mt-3 flex flex-wrap gap-4">
            {(["pos", "rooms", "banquet"] as const).map((module) => (
              <label
                key={module}
                className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary"
              >
                <input
                  type="checkbox"
                  className="size-4 accent-accent-primary"
                  checked={enabledModules.includes(module)}
                  onChange={(e) =>
                    setEnabledModules((prev) =>
                      e.target.checked ? [...new Set([...prev, module])] : prev.filter((item) => item !== module)
                    )
                  }
                />
                {module === "pos" ? "POS" : module === "rooms" ? "Rooms" : "Banquet"}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-text-primary">Feature flags</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Toggle
              label="Website menu sync"
              checked={features.websiteSync}
              onChange={(v) => setFeatures((f) => ({ ...f, websiteSync: v }))}
            />
            <Toggle
              label="AI features"
              checked={features.aiFeatures}
              onChange={(v) => setFeatures((f) => ({ ...f, aiFeatures: v }))}
            />
            <Toggle
              label="WhatsApp ordering"
              checked={features.whatsappOrdering}
              onChange={(v) => setFeatures((f) => ({ ...f, whatsappOrdering: v }))}
            />
            <Toggle
              label="QR ordering"
              checked={features.qrOrdering}
              onChange={(v) => setFeatures((f) => ({ ...f, qrOrdering: v }))}
            />
          </div>
        </div>

        <Button type="button" size="lg" className="w-full sm:w-auto" disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
