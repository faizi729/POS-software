"use client";

import { useEffect, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type WhatsAppSettings = {
  token: string;
  phoneNumberId: string;
  verifyToken: string;
  catalogId: string;
};

export function WhatsAppSettingsCard({ restaurant }: { restaurant: any }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<null | { type: "success" | "error"; message: string }>(null);
  const [data, setData] = useState<WhatsAppSettings>({
    token: restaurant?.settings?.whatsapp?.token ?? "",
    phoneNumberId: restaurant?.settings?.whatsapp?.phoneNumberId ?? "",
    verifyToken: restaurant?.settings?.whatsapp?.verifyToken ?? "",
    catalogId: restaurant?.settings?.whatsapp?.catalogId ?? ""
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings/whatsapp", { cache: "no-store" });
        const payload = (await res.json()) as any;
        if (!res.ok || !payload?.success) return;
        if (cancelled) return;
        setData({
          token: payload.data?.token ?? "",
          phoneNumberId: payload.data?.phoneNumberId ?? "",
          verifyToken: payload.data?.verifyToken ?? "",
          catalogId: payload.data?.catalogId ?? ""
        });
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof WhatsAppSettings>(key: K, value: string) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setStatus(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/settings/whatsapp", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        const payload = (await res.json()) as any;
        if (!res.ok || !payload?.success) {
          setStatus({ type: "error", message: payload?.error ?? "Could not save." });
          return;
        }
        setStatus({ type: "success", message: "WhatsApp credentials saved." });
      } catch {
        setStatus({ type: "error", message: "Request failed." });
      }
    });
  }

  return (
    <Card className="border border-border-subtle bg-bg-elevated">
      <CardHeader className="border-b border-border-subtle bg-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label-text">Settings</p>
            <CardTitle className="mt-2">WhatsApp credentials</CardTitle>
            <p className="mt-1 text-sm text-text-secondary">
              Saved per restaurant (multi-tenant). These are used for catalog sync and messaging.
            </p>
          </div>
          <Badge variant="neutral">{restaurant?.slug ?? "workspace"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4">
        {status ? (
          <div
            className={
              status.type === "success"
                ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
                : "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
            }
          >
            {status.message}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <p className="label-text">Access token</p>
            <Input
              placeholder="WhatsApp Cloud API token"
              value={data.token}
              onChange={(e) => update("token", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <p className="label-text">Phone number ID</p>
            <Input
              placeholder="Meta phone number ID"
              value={data.phoneNumberId}
              onChange={(e) => update("phoneNumberId", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <p className="label-text">Verify token</p>
            <Input
              placeholder="Webhook verify token"
              value={data.verifyToken}
              onChange={(e) => update("verifyToken", e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <p className="label-text">Catalog ID</p>
            <Input
              placeholder="WhatsApp catalog ID"
              value={data.catalogId}
              onChange={(e) => update("catalogId", e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={save}
            disabled={isPending}
            className="min-w-40 bg-accent-primary hover:bg-accent-primary-hover"
          >
            {isPending ? "Saving..." : "Save WhatsApp"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

