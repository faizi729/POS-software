 "use client";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";

export default function RegisterPage() {
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    restaurantName?: string;
    restaurantSlug?: string;
    email?: string;
    password?: string;
  }>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nextErrors: typeof fieldErrors = {};
    if (!restaurantName.trim()) nextErrors.restaurantName = "Restaurant name is required.";
    if (!restaurantSlug.trim()) nextErrors.restaurantSlug = "Workspace slug is required.";
    if (!email.trim()) nextErrors.email = "Owner email is required.";
    if (!password.trim() || password.trim().length < 6) nextErrors.password = "Password must be at least 6 characters.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Fix the highlighted fields", { durationMs: 2600 });
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantName, restaurantSlug, email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to register");
      }
      toast.success("Workspace created", { durationMs: 2400 });
      // Redirect to onboarding
      const rid = data?.restaurant?.id;
      window.location.href = "/onboarding" + (rid ? `?rid=${encodeURIComponent(rid)}` : "");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      toast.error("Couldn’t create workspace", { message: err?.message || "Try again", durationMs: 3400 });
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
            <h1 className="mt-3 max-w-xl text-[2.5rem] leading-[2.9rem] tracking-[-0.04em]">
              Spin up a tenant in minutes.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7">
              Each workspace is isolated by slug or subdomain. Invite staff later from settings.
            </p>
          </div>
        </section>

        <Card className="self-center">
          <CardHeader className="p-6">
            <p className="label-text">Get started</p>
            <h2 className="mt-2">Create a restaurant workspace</h2>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="label-text">Restaurant name</label>
                <Input
                  type="text"
                  placeholder="Amber Yard"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  disabled={loading}
                  aria-invalid={Boolean(fieldErrors.restaurantName)}
                />
                <FieldError message={fieldErrors.restaurantName} />
              </div>
              <div className="space-y-2">
                <label className="label-text">Workspace slug</label>
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
                <label className="label-text">Owner email</label>
                <Input
                  type="email"
                  placeholder="owner@amberyard.com"
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
              {success ? <p className="text-sm text-green-600">{success}</p> : null}
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
                    {loading ? "Creating..." : "Create workspace"}
                  </span>
                  {!loading ? <ArrowRight className="h-4 w-4" /> : <span className="w-4" />}
                </span>
              </Button>
              <p className="text-sm text-text-secondary">
                Already have a workspace?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

