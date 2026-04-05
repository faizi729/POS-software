"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type RestaurantSummary = {
  id: string;
  name: string;
  slug: string;
  settings?: {
    taxMode: "inclusive" | "exclusive";
    gstEnabled: boolean;
    gstRatePercent: number;
    gstin?: string;
  };
} | null;

type TaxSettings = {
  taxMode: "inclusive" | "exclusive";
  gstEnabled: boolean;
  gstRatePercent: number;
  gstin: string;
};

function normalizeGstin(value: string) {
  return value.toUpperCase().replaceAll(/\s+/g, "");
}

export function TaxSettingsPage({ restaurant }: { restaurant: RestaurantSummary }) {
  const initial = useMemo<TaxSettings>(() => {
    return {
      taxMode: restaurant?.settings?.taxMode ?? "exclusive",
      gstEnabled: restaurant?.settings?.gstEnabled ?? true,
      gstRatePercent: restaurant?.settings?.gstRatePercent ?? 5,
      gstin: restaurant?.settings?.gstin ?? ""
    };
  }, [restaurant]);

  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<null | { type: "success" | "error"; message: string }>(
    null
  );

  const [taxMode, setTaxMode] = useState<TaxSettings["taxMode"]>(initial.taxMode);
  const [gstEnabled, setGstEnabled] = useState<boolean>(initial.gstEnabled);
  const [gstRatePercent, setGstRatePercent] = useState<string>(String(initial.gstRatePercent));
  const [gstin, setGstin] = useState<string>(initial.gstin);

  useEffect(() => {
    setTaxMode(initial.taxMode);
    setGstEnabled(initial.gstEnabled);
    setGstRatePercent(String(initial.gstRatePercent));
    setGstin(initial.gstin);
  }, [initial]);

  const parsedRate = Number(gstRatePercent);
  const rateIsValid = Number.isFinite(parsedRate) && parsedRate >= 0 && parsedRate <= 28;

  async function save() {
    setStatus(null);
    if (!rateIsValid) {
      setStatus({ type: "error", message: "GST rate must be between 0 and 28." });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/settings/tax", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taxMode,
            gstEnabled,
            gstRatePercent: parsedRate,
            gstin: normalizeGstin(gstin)
          })
        });

        const payload = (await response.json()) as any;
        if (!response.ok) {
          setStatus({ type: "error", message: payload?.error ?? "Could not save settings." });
          return;
        }

        setStatus({ type: "success", message: "Tax settings saved." });
      } catch (error) {
        console.error(error);
        setStatus({ type: "error", message: "Settings request failed." });
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border-subtle bg-bg-elevated">
        <CardHeader className="border-b border-border-subtle bg-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="label-text">Settings</p>
              <CardTitle className="mt-2">Tax (GST)</CardTitle>
              <p className="mt-1 text-sm text-text-secondary">
                Configure GST for Indian billing. This controls how tax is calculated in orders.
              </p>
            </div>
            <Badge variant="neutral">{restaurant?.name ?? "Restaurant"}</Badge>
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
              <p className="label-text">Tax mode</p>
              <select
                className="h-11 w-full rounded-2xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none"
                value={taxMode}
                onChange={(e) => setTaxMode(e.target.value as TaxSettings["taxMode"])}
              >
                <option value="exclusive">Exclusive (add GST on top)</option>
                <option value="inclusive">Inclusive (prices include GST)</option>
              </select>
              <p className="text-xs text-text-secondary">
                Most Indian menus show MRP inclusive of GST; choose Inclusive if your item prices already include GST.
              </p>
            </div>

            <div className="space-y-2">
              <p className="label-text">GST enabled</p>
              <select
                className="h-11 w-full rounded-2xl border border-border-subtle bg-white px-4 text-sm text-text-primary outline-none"
                value={gstEnabled ? "yes" : "no"}
                onChange={(e) => setGstEnabled(e.target.value === "yes")}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              <p className="text-xs text-text-secondary">Turn off only if you are not charging GST.</p>
            </div>

            <div className="space-y-2">
              <p className="label-text">GST rate (%)</p>
              <Input
                className={!rateIsValid ? "border-rose-300" : ""}
                placeholder="5"
                value={gstRatePercent}
                onChange={(e) => setGstRatePercent(e.target.value)}
              />
              <p className="text-xs text-text-secondary">Common slabs: 0, 5, 12, 18, 28.</p>
            </div>

            <div className="space-y-2">
              <p className="label-text">GSTIN (optional)</p>
              <Input
                placeholder="27ABCDE1234F1Z5"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
              />
              <p className="text-xs text-text-secondary">
                Printed on invoices/receipts if you enable it later. (Format validation can be added next.)
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={save}
              disabled={isPending || !rateIsValid}
              className="min-w-40 bg-accent-primary hover:bg-accent-primary-hover"
            >
              {isPending ? "Saving..." : "Save settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

