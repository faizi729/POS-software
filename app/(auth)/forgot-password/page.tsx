"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ restaurantSlug?: string; email?: string }>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof fieldErrors = {};
    if (!restaurantSlug.trim()) next.restaurantSlug = "Workspace slug is required.";
    if (!email.trim()) next.email = "Email is required.";
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Fix the highlighted fields", { durationMs: 2600 });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, restaurantSlug })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }
      if (data?.ok === false && data?.error) {
        throw new Error(data.error);
      }
      setDone(true);
      toast.success("If that account exists, check your inbox", { durationMs: 4000 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error("Couldn’t send reset", { message, durationMs: 4000 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="surface-card relative overflow-hidden p-8 md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.15),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(217,119,6,0.15),transparent_28%)]" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl border border-border-subtle bg-white/80 shadow-soft backdrop-blur">
                <Image src="/logo.png" alt="Rasoio" width={26} height={26} className="select-none" priority />
              </span>
              <p className="label-text">Rasoio</p>
            </div>
            <h1 className="mt-3 max-w-xl text-[2.5rem] leading-[2.9rem] tracking-[-0.04em]">Reset access safely.</h1>
            <p className="mt-4 max-w-lg text-base leading-7">
              We will email you a single-use link if the workspace and email match an account. Links expire in one hour.
            </p>
          </div>
        </section>

        <Card className="self-center">
          <CardHeader className="p-6">
            <p className="label-text">Forgot password</p>
            <h2 className="mt-2">Request a reset link</h2>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {done ? (
              <p className="text-sm text-text-secondary">
                If an account exists for that workspace and email, we sent instructions. Check your spam folder, then{" "}
                <Link href="/login" className="font-semibold text-accent-primary hover:underline">
                  return to sign in
                </Link>
                .
              </p>
            ) : (
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <label className="label-text">Workspace (slug)</label>
                  <Input
                    type="text"
                    placeholder="amberyard"
                    value={restaurantSlug}
                    onChange={(e) => setRestaurantSlug(e.target.value.toLowerCase())}
                    disabled={loading}
                    aria-invalid={Boolean(fieldErrors.restaurantSlug)}
                  />
                  <FieldError message={fieldErrors.restaurantSlug} />
                </div>
                <div className="space-y-2">
                  <label className="label-text">Email</label>
                  <Input
                    type="email"
                    placeholder="you@restaurant.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoComplete="email"
                    aria-invalid={Boolean(fieldErrors.email)}
                  />
                  <FieldError message={fieldErrors.email} />
                </div>
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <Button className="w-full justify-between" size="lg" type="submit" disabled={loading}>
                  <span className="flex w-full items-center justify-center gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    <span className="flex-1 text-center">{loading ? "Sending…" : "Send reset link"}</span>
                    {!loading ? <ArrowRight className="h-4 w-4" /> : <span className="w-4" />}
                  </span>
                </Button>
              </form>
            )}
            <p className="text-sm text-text-secondary">
              <Link href="/login" className="font-semibold text-accent-primary hover:underline">
                ← Back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
