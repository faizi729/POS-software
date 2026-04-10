"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, ShieldCheck, Sparkles, Webhook, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type DemoFormState = {
  name: string;
  phone: string;
  restaurant: string;
  city: string;
};

const INITIAL: DemoFormState = { name: "", phone: "", restaurant: "", city: "" };

export default function DemoBookingPage() {
  const [form, setForm] = useState<DemoFormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(form.name.trim() && form.phone.trim() && form.restaurant.trim());
  }, [form.name, form.phone, form.restaurant]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to request demo");
      setSuccess("Request received. We’ll reach out to confirm your live walkthrough.");
      setForm(INITIAL);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="section-shell py-10 md:py-14">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <section className="surface-card relative overflow-hidden p-6 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(217,119,6,0.16),transparent_30%)]" />
          <div className="relative">
            <p className="label-text">Live walkthrough</p>
            <h1 className="mt-3 max-w-2xl text-balance text-[2.4rem] font-extrabold leading-[2.75rem] tracking-[-0.04em] md:text-[3rem] md:leading-[3.35rem]">
              Watch the sync live:
              <br />
              <span className="text-accent-primary">POS edit → website update</span> in seconds.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7">
              In 15 minutes, we prove it on WhatsApp/Meet. If we can’t show a live POS change updating a live website menu,
              you should not switch.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <ProofPill icon={Webhook} title="Auto‑sync" body="Prices, photos, sold‑out." />
              <ProofPill icon={Zap} title="Speed" body="Rush‑hour friendly flows." />
              <ProofPill icon={ShieldCheck} title="Confidence" body="Clear next steps." />
            </div>

            <div className="mt-6 rounded-2xl border border-border-subtle bg-white/70 p-4 backdrop-blur">
              <p className="text-sm font-semibold text-text-primary">You’ll leave with:</p>
              <ul className="mt-2 space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 grid size-5 place-items-center rounded-full bg-[rgba(21,128,61,0.12)] text-success">
                    <Sparkles className="size-3.5" />
                  </span>
                  A live sync walkthrough using your menu structure
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 grid size-5 place-items-center rounded-full bg-[rgba(21,128,61,0.12)] text-success">
                    <Sparkles className="size-3.5" />
                  </span>
                  A recommended setup + migration timeline
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 grid size-5 place-items-center rounded-full bg-[rgba(21,128,61,0.12)] text-success">
                    <Sparkles className="size-3.5" />
                  </span>
                  Pricing confirmed for your outlets + needs (₹/month/location)
                </li>
              </ul>
            </div>

            <p className="mt-5 text-sm text-text-muted">
              Prefer to explore first?{" "}
              <Link className="font-semibold text-accent-primary hover:underline" href="/">
                Back to the homepage
              </Link>
            </p>
          </div>
        </section>

        <Card className="self-start">
          <CardHeader className="p-6">
            <p className="label-text">Request a demo</p>
            <CardTitle className="mt-2 text-xl">We’ll confirm your slot fast</CardTitle>
            <p className="mt-1 text-sm">
              Share the basics. We’ll reach out on WhatsApp to confirm your live sync walkthrough.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <form className="space-y-4" onSubmit={onSubmit}>
              <Field
                label="Your name"
                value={form.name}
                onChange={(v) => setForm((s) => ({ ...s, name: v }))}
                placeholder="Aarav"
                disabled={loading}
              />
              <Field
                label="Phone (WhatsApp)"
                value={form.phone}
                onChange={(v) => setForm((s) => ({ ...s, phone: v }))}
                placeholder="+91 98xxxxxx12"
                disabled={loading}
              />
              <Field
                label="Restaurant name"
                value={form.restaurant}
                onChange={(v) => setForm((s) => ({ ...s, restaurant: v }))}
                placeholder="Amber Yard"
                disabled={loading}
              />
              <Field
                label="City (optional)"
                value={form.city}
                onChange={(v) => setForm((s) => ({ ...s, city: v }))}
                placeholder="Bengaluru"
                disabled={loading}
              />

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {success ? <p className="text-sm text-green-700">{success}</p> : null}

              <Button
                className="mt-2 w-full justify-between"
                size="lg"
                type="submit"
                disabled={loading || !canSubmit}
                aria-busy={loading}
              >
                <span className="flex w-full items-center justify-center gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span className="flex-1 text-center">
                    {loading ? "Sending..." : "Lock the live sync walkthrough"}
                  </span>
                  {!loading ? <ArrowRight className="h-4 w-4" /> : <span className="w-4" />}
                </span>
              </Button>

              <p className="text-center text-xs text-text-muted">
                No signup. No commitment. Live proof first. WhatsApp confirmation.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="label-text">{label}</label>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}

function ProofPill({
  icon: Icon,
  title,
  body
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-white/70 px-4 py-3 backdrop-blur">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-[rgba(15,118,110,0.10)] text-accent-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          <p className="mt-0.5 text-xs text-text-muted">{body}</p>
        </div>
      </div>
    </div>
  );
}

