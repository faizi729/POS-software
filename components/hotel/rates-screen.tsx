"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";

export type RatePlanRow = {
  id: string;
  name: string;
  roomTypeId: string;
  roomTypeName: string;
  dateFrom: string;
  dateTo: string;
  weekdays: number[];
  baseRate: number;
  mealPlan: string;
  mealPlanAmount: number;
  discountCode: string;
  discountPercent: number;
  minNights: number;
  active: boolean;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function RatesScreen({
  plans,
  roomTypes
}: {
  plans: RatePlanRow[];
  roomTypes: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");
  const [baseRate, setBaseRate] = useState("");
  const [mealPlan, setMealPlan] = useState("EP");
  const [minNights, setMinNights] = useState("1");
  const [discountCode, setDiscountCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [weekdays, setWeekdays] = useState<number[]>([]);

  async function send(url: string, method: string, body?: unknown) {
    setSaving(true);
    setError(null);
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(data?.error || "Request failed");
      return false;
    }
    router.refresh();
    return true;
  }

  async function importCard(file: File) {
    setSaving(true);
    setError(null);
    setNotice(null);
    const body = new FormData();
    body.append("files", file);
    const response = await fetch("/api/hotel/rate-plans/import?apply=true", { method: "POST", body });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(data?.error || "Import failed");
      return;
    }
    const applied = data?.data?.applied ?? 0;
    setNotice(applied ? `${applied} plans imported` : "Nothing could be read");
    if (applied) router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Rates</h1>
        <label className="cursor-pointer text-sm font-medium text-text-secondary">
          {saving ? "Working…" : "Import rate card"}
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importCard(file);
            }}
          />
        </label>
      </div>

      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
      {notice ? <p className="text-sm text-text-secondary">{notice}</p> : null}

      <section className="surface-card space-y-3 p-4">
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Plan</span>
            <input
              className="mt-1 h-9 w-36 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Room type</span>
            <select
              className="mt-1 h-9 w-40 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={roomTypeId}
              onChange={(event) => setRoomTypeId(event.target.value)}
            >
              <option value="">All</option>
              {roomTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Rate</span>
            <input
              type="number"
              min={0}
              className="mt-1 h-9 w-28 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={baseRate}
              onChange={(event) => setBaseRate(event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Meal</span>
            <select
              className="mt-1 h-9 w-20 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={mealPlan}
              onChange={(event) => setMealPlan(event.target.value)}
            >
              {["EP", "CP", "MAP", "AP"].map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Min nights</span>
            <input
              type="number"
              min={1}
              className="mt-1 h-9 w-20 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={minNights}
              onChange={(event) => setMinNights(event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium text-text-secondary">Code</span>
            <input
              className="mt-1 h-9 w-28 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={discountCode}
              onChange={(event) => setDiscountCode(event.target.value.toUpperCase())}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium text-text-secondary">%</span>
            <input
              type="number"
              min={0}
              max={100}
              className="mt-1 h-9 w-20 rounded-xl border border-border-subtle bg-white px-3 text-sm"
              value={discountPercent}
              onChange={(event) => setDiscountPercent(event.target.value)}
            />
          </label>
          <Button
            size="sm"
            disabled={saving || !name.trim() || baseRate === ""}
            onClick={async () => {
              const done = await send("/api/hotel/rate-plans", "POST", {
                name: name.trim(),
                roomTypeId,
                baseRate: Number(baseRate) || 0,
                mealPlan,
                minNights: Number(minNights) || 1,
                discountCode,
                discountPercent: Number(discountPercent) || 0,
                weekdays
              });
              if (done) {
                setName("");
                setBaseRate("");
                setDiscountCode("");
                setWeekdays([]);
              }
            }}
          >
            Add plan
          </Button>
        </div>

        <div className="flex flex-wrap gap-1">
          {DAY_LABELS.map((label, index) => {
            const active = weekdays.includes(index);
            return (
              <button
                key={label}
                type="button"
                className={`h-7 rounded-lg px-2 text-xs font-medium ${
                  active ? "bg-text-primary text-white" : "border border-border-subtle text-text-secondary"
                }`}
                onClick={() =>
                  setWeekdays(active ? weekdays.filter((day) => day !== index) : [...weekdays, index])
                }
              >
                {label}
              </button>
            );
          })}
        </div>
        {/* ROWS */}
        <table className="w-full min-w-[560px] text-sm">
          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td className="py-6 text-center text-text-muted" colSpan={5}>
                  No rate plans
                </td>
              </tr>
            ) : null}
            {plans.map((plan) => (
              <tr key={plan.id} className="border-t border-border-subtle">
                <td className="py-2 font-medium text-text-primary">{plan.name}</td>
                <td className="py-2 text-text-secondary">
                  {plan.roomTypeName}
                  {plan.weekdays.length ? ` · ${plan.weekdays.map((day) => DAY_LABELS[day]).join(" ")}` : ""}
                  {plan.dateFrom ? ` · ${plan.dateFrom}${plan.dateTo ? ` → ${plan.dateTo}` : ""}` : ""}
                </td>
                <td className="py-2 text-text-secondary">
                  {formatCurrency(plan.baseRate)} · {plan.mealPlan}
                  {plan.mealPlanAmount ? ` +${formatCurrency(plan.mealPlanAmount)}` : ""}
                </td>
                <td className="py-2 text-text-secondary">
                  {plan.discountCode ? `${plan.discountCode} ${plan.discountPercent}%` : "—"}
                </td>
                <td className="py-2 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={saving}
                    onClick={() => void send(`/api/hotel/rate-plans/${plan.id}`, "PATCH", { active: !plan.active })}
                  >
                    {plan.active ? "Disable" : "Enable"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
