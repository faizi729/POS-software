"use client";

import { useEffect, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ProfileData = {
  name: string;
  phone: string;
  email: string;
  address: string;
  orderPrefix: string;
  serviceChargeEnabled: boolean;
};

export function RestaurantProfileCard({ restaurant }: { restaurant: any }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<null | { type: "success" | "error"; message: string }>(null);
  const [profile, setProfile] = useState<ProfileData>({
    name: restaurant?.name ?? "",
    phone: restaurant?.contact?.phone ?? "",
    email: restaurant?.contact?.email ?? "",
    address: restaurant?.contact?.address ?? "",
    orderPrefix: restaurant?.settings?.orderPrefix ?? "POS",
    serviceChargeEnabled: restaurant?.settings?.serviceChargeEnabled ?? false
  });

  useEffect(() => {
    setProfile({
      name: restaurant?.name ?? "",
      phone: restaurant?.contact?.phone ?? "",
      email: restaurant?.contact?.email ?? "",
      address: restaurant?.contact?.address ?? "",
      orderPrefix: restaurant?.settings?.orderPrefix ?? "POS",
      serviceChargeEnabled: restaurant?.settings?.serviceChargeEnabled ?? false
    });
  }, [restaurant]);

  function update(field: keyof ProfileData, value: string | boolean) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  async function save() {
    setStatus(null);
    if (!profile.name.trim()) {
      setStatus({ type: "error", message: "Restaurant name is required." });
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/settings/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile)
        });

        const payload = (await res.json()) as any;
        if (!res.ok) {
          setStatus({ type: "error", message: payload?.error ?? "Could not save." });
          return;
        }
        setStatus({ type: "success", message: "Restaurant profile saved." });
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
            <CardTitle className="mt-2">Restaurant Profile</CardTitle>
            <p className="mt-1 text-sm text-text-secondary">
              Basic information about your restaurant. This appears on invoices and receipts.
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
          <div className="space-y-2">
            <p className="label-text">Restaurant name *</p>
            <Input
              placeholder="e.g. Amber Yard"
              value={profile.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <p className="label-text">Phone</p>
            <Input
              placeholder="e.g. +91 98765 43210"
              value={profile.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <p className="label-text">Email</p>
            <Input
              type="email"
              placeholder="e.g. info@amberyard.com"
              value={profile.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <p className="label-text">Order number prefix</p>
            <Input
              placeholder="POS"
              value={profile.orderPrefix}
              onChange={(e) => update("orderPrefix", e.target.value)}
              maxLength={6}
            />
            <p className="text-xs text-text-secondary">
              Order numbers will be like {profile.orderPrefix || "POS"}-123456.
            </p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <p className="label-text">Address</p>
            <Input
              placeholder="e.g. 123, MG Road, Bengaluru 560001"
              value={profile.address}
              onChange={(e) => update("address", e.target.value)}
            />
            <p className="text-xs text-text-secondary">Printed on invoices and receipts.</p>
          </div>
          <div className="space-y-2">
            <p className="label-text">Service charge</p>
            <select
              className="h-11 w-full rounded-2xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none"
              value={profile.serviceChargeEnabled ? "yes" : "no"}
              onChange={(e) => update("serviceChargeEnabled", e.target.value === "yes")}
            >
              <option value="no">Disabled</option>
              <option value="yes">Enabled</option>
            </select>
            <p className="text-xs text-text-secondary">
              If enabled, a service charge line will appear on bills.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={save}
            disabled={isPending}
            className="min-w-40 bg-accent-primary hover:bg-accent-primary-hover"
          >
            {isPending ? "Saving..." : "Save profile"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
