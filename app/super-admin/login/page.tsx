"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "@/lib/toast";

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: typeof fieldErrors = {};
    if (!email.trim()) nextErrors.email = "Email is required.";
    if (!password.trim()) nextErrors.password = "Password is required.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Fix the highlighted fields", { durationMs: 2600 });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/super-admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Login failed");
      toast.success("Signed in", { durationMs: 2200 });
      window.location.href = "/super-admin";
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
      toast.error("Sign in failed", { message: err?.message || "Try again", durationMs: 3400 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="surface-card relative overflow-hidden p-8 md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.15),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(217,119,6,0.15),transparent_28%)]" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl border border-border-subtle bg-white/80 shadow-soft backdrop-blur">
                <Image src="/logo.png" alt="Rasoio" width={26} height={26} className="select-none" priority />
              </span>
              <p className="label-text">Platform control plane</p>
            </div>
            <h1 className="mt-3 max-w-xl text-[2.6rem] leading-[3.05rem] tracking-[-0.04em]">
              Super Admin
              <br />
              <span className="text-text-secondary">Tenants, plans, flags, audits.</span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7">
              This area controls every restaurant tenant. Access is strictly logged.
            </p>
            <div className="mt-8 flex items-center gap-2 rounded-2xl border border-border-subtle bg-white/80 px-4 py-4 backdrop-blur">
              <span className="grid size-10 place-items-center rounded-2xl bg-[rgba(15,118,110,0.10)] text-accent-primary">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-text-primary">RBAC enforced server-side</p>
                <p className="mt-0.5 text-sm">Never trust the frontend for tenant access.</p>
              </div>
            </div>
            <p className="mt-6 text-sm text-text-muted">
              Back to site:{" "}
              <Link href="/" className="font-semibold text-accent-primary hover:underline">
                /
              </Link>
            </p>
          </div>
        </section>

        <Card className="self-center">
          <CardHeader className="p-6">
            <p className="label-text">Sign in</p>
            <h2 className="mt-2">Super Admin access</h2>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="label-text">Email</label>
                <Input
                  type="email"
                  placeholder="admin@yourcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  aria-invalid={Boolean(fieldErrors.email)}
                />
                <FieldError message={fieldErrors.email} />
              </div>
              <div className="space-y-2">
                <label className="label-text">Password</label>
                <PasswordInput
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  aria-invalid={Boolean(fieldErrors.password)}
                />
                <FieldError message={fieldErrors.password} />
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button className="mt-2 w-full justify-between" size="lg" type="submit" disabled={loading}>
                <span className="flex w-full items-center justify-center gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span className="flex-1 text-center">{loading ? "Signing in..." : "Continue"}</span>
                  {!loading ? <ArrowRight className="h-4 w-4" /> : <span className="w-4" />}
                </span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

