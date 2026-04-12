"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "@/lib/toast";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") || "").trim();
  const slug = (searchParams.get("slug") || "").trim().toLowerCase();

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; password2?: string }>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof fieldErrors = {};
    if (password.length < 8) next.password = "At least 8 characters.";
    if (password !== password2) next.password2 = "Passwords do not match.";
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    if (!token || !slug) {
      setError("Invalid reset link. Request a new one from forgot password.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, restaurantSlug: slug, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Reset failed");
      }
      setDone(true);
      toast.success("Password updated — you can sign in", { durationMs: 3200 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error("Reset failed", { message, durationMs: 4000 });
    } finally {
      setLoading(false);
    }
  }

  if (!token || !slug) {
    return (
      <p className="text-sm text-text-secondary">
        This link is missing a token or workspace.{" "}
        <Link
          href={"/forgot-password" as Parameters<typeof Link>[0]["href"]}
          className="font-semibold text-accent-primary hover:underline"
        >
          Request a new reset
        </Link>
        .
      </p>
    );
  }

  if (done) {
    return (
      <p className="text-sm text-text-secondary">
        Your password was updated.{" "}
        <Link href="/login" className="font-semibold text-accent-primary hover:underline">
          Sign in
        </Link>
        .
      </p>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <label className="label-text">New password</label>
        <PasswordInput
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          autoComplete="new-password"
          aria-invalid={Boolean(fieldErrors.password)}
        />
        <FieldError message={fieldErrors.password} />
      </div>
      <div className="space-y-2">
        <label className="label-text">Confirm password</label>
        <PasswordInput
          placeholder="••••••••"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          disabled={loading}
          autoComplete="new-password"
          aria-invalid={Boolean(fieldErrors.password2)}
        />
        <FieldError message={fieldErrors.password2} />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button className="w-full" size="lg" type="submit" disabled={loading}>
        {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Save new password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
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
            <h1 className="mt-3 max-w-xl text-[2.5rem] leading-[2.9rem] tracking-[-0.04em]">Choose a new password.</h1>
            <p className="mt-4 max-w-lg text-base leading-7">Use a strong password you do not reuse on other sites.</p>
          </div>
        </section>

        <Card className="self-center">
          <CardHeader className="p-6">
            <p className="label-text">Reset password</p>
            <h2 className="mt-2">Set a new password</h2>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <Suspense
              fallback={<p className="text-sm text-text-muted">Loading…</p>}
            >
              <ResetPasswordForm />
            </Suspense>
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
