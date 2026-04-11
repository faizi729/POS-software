"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SettingsMap = Record<string, unknown>;

export function GlobalSettingsForm({
  initial,
  canEdit
}: {
  initial: SettingsMap;
  canEdit: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [supportEmail, setSupportEmail] = useState(String(initial.platform_support_email ?? ""));
  const [trialDays, setTrialDays] = useState(Number(initial.default_trial_days ?? 14));
  const [maintenance, setMaintenance] = useState(Boolean(initial.maintenance_mode ?? false));
  const [legalName, setLegalName] = useState(String(initial.billing_company_legal_name ?? ""));
  const [gstin, setGstin] = useState(String(initial.billing_gstin ?? ""));

  async function save() {
    if (!canEdit) return;
    setSaving(true);
    setMsg(null);
    setErr(null);
    const res = await fetch("/api/super-admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform_support_email: supportEmail || undefined,
        default_trial_days: trialDays,
        maintenance_mode: maintenance,
        billing_company_legal_name: legalName || undefined,
        billing_gstin: gstin || undefined
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setErr(data.error || "Failed");
    else setMsg("Saved.");
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {!canEdit ? (
        <p className="text-sm font-semibold text-warning">Only super_admin can change global settings.</p>
      ) : null}
      {err ? <p className="text-sm text-danger">{err}</p> : null}
      {msg ? <p className="text-sm text-success">{msg}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-primary" htmlFor="gs-support">
            Platform support email
          </label>
          <Input
            id="gs-support"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            disabled={!canEdit}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-primary" htmlFor="gs-trial">
            Default trial (days)
          </label>
          <Input
            id="gs-trial"
            type="number"
            min={0}
            max={90}
            value={trialDays}
            onChange={(e) => setTrialDays(Number(e.target.value))}
            disabled={!canEdit}
          />
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <input
            id="gs-maint"
            type="checkbox"
            className="size-4 accent-accent-primary"
            checked={maintenance}
            onChange={(e) => setMaintenance(e.target.checked)}
            disabled={!canEdit}
          />
          <label htmlFor="gs-maint" className="text-sm font-semibold text-text-primary">
            Maintenance mode (tenant apps should read this flag from API in your next iteration)
          </label>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-primary" htmlFor="gs-legal">
            Billing legal name
          </label>
          <Input id="gs-legal" value={legalName} onChange={(e) => setLegalName(e.target.value)} disabled={!canEdit} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-primary" htmlFor="gs-gstin">
            Billing GSTIN
          </label>
          <Input id="gs-gstin" value={gstin} onChange={(e) => setGstin(e.target.value)} disabled={!canEdit} />
        </div>
      </div>

      <Button type="button" disabled={!canEdit || saving} onClick={() => void save()}>
        {saving ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
