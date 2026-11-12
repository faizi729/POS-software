"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "@/lib/toast";
import type { AppModule } from "@/lib/constants/roles";

const PLAN_OPTIONS = [
  { value: "none", label: "Unassigned (no tier)" },
  { value: "starter", label: "starter" },
  { value: "growth", label: "growth" },
  { value: "scale", label: "scale" }
] as const;

const CURRENCY_OPTIONS = ["INR", "USD", "AED", "GBP", "EUR", "SGD"];

const MODULE_OPTIONS: Array<{ value: AppModule; label: string }> = [
  { value: "pos", label: "POS" },
  { value: "rooms", label: "Rooms" },
  { value: "banquet", label: "Banquet" }
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function randomPassword() {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
  const bytes = new Uint32Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

type FieldErrors = { name?: string; slug?: string; ownerEmail?: string; ownerPassword?: string };

export function NewTenantForm({
  canWrite,
  defaultTimezone
}: {
  canWrite: boolean;
  defaultTimezone: string;
}) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [currency, setCurrency] = useState("INR");
  const [plan, setPlan] = useState<(typeof PLAN_OPTIONS)[number]["value"]>("none");
  const [modules, setModules] = useState<AppModule[]>(["pos"]);

  const [ownerName, setOwnerName] = useState("Owner");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) return;

    const next: FieldErrors = {};
    const slugValue = (slug || slugify(name)).trim();

    if (!name.trim() || name.trim().length < 2) {
      next.name = "Restaurant name is required (min 2 characters).";
    }
    if (!slugValue) {
      next.slug = "Workspace slug is required.";
    } else if (!/^[a-z0-9-]+$/.test(slugValue)) {
      next.slug = "Use lowercase letters, numbers and dashes only.";
    }

    const wantsOwner = Boolean(ownerEmail.trim() || ownerPassword);
    if (wantsOwner) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim())) {
        next.ownerEmail = "Enter a valid owner email.";
      }
      if (ownerPassword.length < 8) {
        next.ownerPassword = "Password must be at least 8 characters.";
      }
    }

    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Fix the highlighted fields", { durationMs: 2600 });
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/super-admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slugValue,
          timezone: timezone.trim() || defaultTimezone,
          currency,
          plan,
          enabledModules: modules.length ? modules : ["pos"],
          ownerName: wantsOwner ? ownerName.trim() || "Owner" : undefined,
          ownerEmail: wantsOwner ? ownerEmail.trim().toLowerCase() : undefined,
          ownerPassword: wantsOwner ? ownerPassword : undefined,
          twoFactorEnabled: wantsOwner ? twoFactorEnabled : undefined
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const details = data?.details?.fieldErrors;
        const firstDetail = details
          ? (Object.values(details).flat().filter(Boolean)[0] as string | undefined)
          : null;
        throw new Error(data?.error || firstDetail || "Failed to create tenant");
      }

      toast.success("Tenant created", { message: `Slug: ${slugValue}`, durationMs: 3000 });
      router.push(`/super-admin/tenants/${data.tenantId}`);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error("Couldn’t create tenant", { message, durationMs: 4000 });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">New tenant</CardTitle>
      </CardHeader>
      <CardContent>
        {!canWrite ? (
          <p className="mb-4 text-sm font-semibold text-warning">Read-only role — cannot create tenants.</p>
        ) : null}
        {error ? <p className="mb-4 text-sm font-semibold text-danger">{error}</p> : null}

        <form className="space-y-6" onSubmit={onSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="nt-name" className="text-sm font-semibold text-text-primary">
                Name
              </label>
              <Input
                id="nt-name"
                value={name}
                placeholder="Amber Yard"
                autoFocus
                onChange={(e) => {
                  const value = e.target.value;
                  setName(value);
                  if (!slugTouched) setSlug(slugify(value));
                }}
              />
              <FieldError message={fieldErrors.name} />
            </div>

            <div className="space-y-2">
              <label htmlFor="nt-slug" className="text-sm font-semibold text-text-primary">
                Slug
              </label>
              <Input
                id="nt-slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
              />
              <FieldError message={fieldErrors.slug} />
            </div>

            <div className="space-y-2">
              <label htmlFor="nt-tz" className="text-sm font-semibold text-text-primary">
                Timezone
              </label>
              <Input
                id="nt-tz"
                value={timezone}
                placeholder="Asia/Kolkata"
                onChange={(e) => setTimezone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="nt-currency" className="text-sm font-semibold text-text-primary">
                Currency
              </label>
              <select
                id="nt-currency"
                className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm font-semibold text-text-primary"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="nt-plan" className="text-sm font-semibold text-text-primary">
                Plan
              </label>
              <select
                id="nt-plan"
                className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm font-semibold text-text-primary"
                value={plan}
                onChange={(e) => setPlan(e.target.value as (typeof PLAN_OPTIONS)[number]["value"])}
              >
                {PLAN_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:col-span-2">
              {MODULE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary"
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-accent-primary"
                    checked={modules.includes(option.value)}
                    onChange={(e) =>
                      setModules((prev) =>
                        e.target.checked
                          ? [...new Set([...prev, option.value])]
                          : prev.filter((item) => item !== option.value)
                      )
                    }
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4 border-t border-border-subtle pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="nt-owner-name" className="text-sm font-semibold text-text-primary">
                  Owner name
                </label>
                <Input id="nt-owner-name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label htmlFor="nt-owner-email" className="text-sm font-semibold text-text-primary">
                  Owner email
                </label>
                <Input
                  id="nt-owner-email"
                  type="email"
                  autoComplete="off"
                  value={ownerEmail}
                  placeholder="owner@restaurant.com"
                  onChange={(e) => setOwnerEmail(e.target.value)}
                />
                <FieldError message={fieldErrors.ownerEmail} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="nt-owner-password" className="text-sm font-semibold text-text-primary">
                  Owner password
                </label>
                <div className="flex gap-2">
                  <PasswordInput
                    id="nt-owner-password"
                    autoComplete="new-password"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0"
                    onClick={() => setOwnerPassword(randomPassword())}
                  >
                    <Wand2 className="size-4" />
                    Generate
                  </Button>
                </div>
                <FieldError message={fieldErrors.ownerPassword} />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                className="size-4 accent-accent-primary"
                checked={twoFactorEnabled}
                onChange={(e) => setTwoFactorEnabled(e.target.checked)}
              />
              Email sign-in code
            </label>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full justify-center sm:w-auto"
            disabled={saving || !canWrite}
          >
            {saving ? "Creating…" : "Create tenant"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
