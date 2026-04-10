 "use client";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "@/lib/toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ restaurantSlug?: string; email?: string; password?: string }>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: typeof fieldErrors = {};
    if (!restaurantSlug.trim()) nextErrors.restaurantSlug = "Workspace slug is required.";
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, restaurantSlug })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to sign in");
      }
      toast.success("Signed in", { durationMs: 2200 });
      window.location.href = "/dashboard"; // redirect to dashboard
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      toast.error("Sign in failed", { message: err?.message || "Try again", durationMs: 3400 });
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
            <h1 className="mt-3 max-w-xl text-[2.75rem] leading-[3.1rem] tracking-[-0.04em]">
              Premium counter speed with a calm, modern back office.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7">
              A multi-tenant POS foundation built for service-heavy restaurants, live menu control,
              and clean same-day reporting.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                ["138", "orders processed"],
                ["91%", "paid completion"],
                ["4.7m", "avg checkout time"]
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-border-subtle bg-white/80 px-4 py-4 backdrop-blur">
                  <p className="text-2xl font-bold tracking-[-0.03em] text-text-primary">{value}</p>
                  <p className="mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Card className="self-center">
          <CardHeader className="p-6">
            <p className="label-text">Welcome back</p>
            <h2 className="mt-2">Sign in to your restaurant workspace</h2>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="label-text">Workspace (slug)</label>
                <Input
                  type="text"
                  placeholder="amberyard"
                  value={restaurantSlug}
                  onChange={(e) => setRestaurantSlug(e.target.value)}
                  disabled={loading}
                  aria-invalid={Boolean(fieldErrors.restaurantSlug)}
                />
                <FieldError message={fieldErrors.restaurantSlug} />
              </div>
              <div className="space-y-2">
                <label className="label-text">Email</label>
                <Input
                  type="email"
                  placeholder="manager@amberyard.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  aria-invalid={Boolean(fieldErrors.email)}
                />
                <FieldError message={fieldErrors.email} />
              </div>
              <div className="space-y-2">
                <label className="label-text">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  aria-invalid={Boolean(fieldErrors.password)}
                />
                <FieldError message={fieldErrors.password} />
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button
                className="mt-2 w-full justify-between"
                size="lg"
                type="submit"
                disabled={loading}
                aria-busy={loading}
              >
                <span className="flex w-full items-center justify-center gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span className="flex-1 text-center">
                    {loading ? "Signing in..." : "Continue"}
                  </span>
                  {!loading ? <ArrowRight className="h-4 w-4" /> : <span className="w-4" />}
                </span>
              </Button>
              <p className="text-sm text-text-secondary">
                New restaurant?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Create a workspace
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
