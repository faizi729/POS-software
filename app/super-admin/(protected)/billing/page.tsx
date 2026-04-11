import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant } from "@/models/Restaurant";
import { PLAN_CATALOG } from "@/lib/super-admin/plan-catalog";
import { formatPlanLabel } from "@/lib/super-admin/plan-label";
import {
  getConfiguredSaasPlans,
  getRazorpayPlanIdForSaasPlan,
  razorpayKeysPresent,
  saasSubscriptionTotalCount
} from "@/lib/billing/razorpay-saas-config";
import { loadSaasTierPricingFromRazorpay, type SaasTierPricing } from "@/lib/billing/fetch-saas-plan-prices";
import { WA_CONFIG } from "@/lib/whatsapp/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function SuperAdminBillingPage() {
  await connectToDatabase();

  const byPlan = await Restaurant.aggregate([{ $group: { _id: "$plan", n: { $sum: 1 } } }]);
  const bySub = await Restaurant.aggregate([{ $group: { _id: "$subscriptionStatus", n: { $sum: 1 } } }]);
  const planMap = Object.fromEntries((byPlan as any[]).map((r) => [String(r._id ?? "none"), r.n]));
  const unassignedCount = planMap.none ?? 0;
  const rzPlans = getConfiguredSaasPlans();
  const base = WA_CONFIG.appBaseUrl.replace(/\/$/, "");
  const razorpayLive = razorpayKeysPresent();
  const tenantsOnRazorpay = await Restaurant.countDocuments({
    razorpaySubscriptionId: { $exists: true, $nin: [null, ""] }
  });
  const tierPrices: SaasTierPricing | null = razorpayLive ? await loadSaasTierPricingFromRazorpay() : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="label-text">Revenue</p>
        <h1 className="mt-2 text-2xl font-extrabold text-text-primary">Plans & billing</h1>
        <p className="mt-2 text-sm text-text-secondary">
          {razorpayLive ? (
            <>
              <strong className="font-semibold text-text-primary">Razorpay</strong> is your source of subscription
              pricing (amounts below are fetched live from your Plan IDs). Feature caps (outlets, seats, etc.) are still
              enforced in-app by <strong className="font-semibold text-text-primary">Restaurant.plan</strong>.
            </>
          ) : (
            <>
              Reference catalog for limits and illustrative MRR; add Razorpay keys + plan IDs to bill tenants via
              subscriptions.
            </>
          )}
        </p>
      </div>

      <Card className="border-[rgba(15,118,110,0.25)]">
        <CardHeader>
          <CardTitle className="text-base">Razorpay (SaaS subscriptions)</CardTitle>
          <p className="text-sm text-text-secondary">
            Same keys as WhatsApp payment links. Add Razorpay <strong>Plan IDs</strong> from Dashboard → Subscriptions →
            Plans.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant={razorpayKeysPresent() ? "success" : "danger"}>
              API keys: {razorpayKeysPresent() ? "set" : "missing"}
            </Badge>
            <Badge variant={WA_CONFIG.razorpayWebhookSecret?.trim() ? "success" : "warning"}>
              Webhook secret: {WA_CONFIG.razorpayWebhookSecret?.trim() ? "set" : "missing"}
            </Badge>
            <Badge variant="neutral">Monthly cycles: {saasSubscriptionTotalCount("monthly")}</Badge>
            <Badge variant="neutral">Yearly cycles: {saasSubscriptionTotalCount("yearly")}</Badge>
          </div>
          <ul className="space-y-2 text-text-secondary">
            {(["starter", "growth", "scale"] as const).map((code) => (
              <li key={code} className="rounded-lg border border-border-subtle bg-bg-surface/60 px-3 py-2">
                <span className="font-semibold capitalize text-text-primary">{code}</span>
                <div className="mt-1 grid gap-1 text-sm sm:grid-cols-2">
                  {(["monthly", "yearly"] as const).map((iv) => {
                    const ok = rzPlans[code][iv];
                    const id = getRazorpayPlanIdForSaasPlan(code, iv);
                    return (
                      <div key={iv}>
                        <code className="rounded bg-bg-surface px-1 text-xs">
                          RAZORPAY_PLAN_ID_{code.toUpperCase()}_{iv.toUpperCase()}
                        </code>{" "}
                        {ok ? (
                          <span className="text-success">set</span>
                        ) : (
                          <span className="text-text-muted">not set</span>
                        )}
                        {id ? (
                          <span className="ml-1 text-xs text-text-muted">({id.slice(0, 6)}…)</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-text-muted">
            Optional legacy: <code className="rounded bg-bg-surface px-1">RAZORPAY_PLAN_ID_STARTER</code> (same tier,
            no suffix) is used as monthly if <code className="rounded bg-bg-surface px-1">_MONTHLY</code> is empty.
          </p>
          <p className="text-text-muted">
            Webhook URL (pick one):{" "}
            <code className="break-all rounded bg-bg-surface px-1 text-xs">{base}/api/billing/razorpay/webhook</code>
          </p>
          <p className="text-text-muted">
            Enable events: <code className="rounded bg-bg-surface px-1">subscription.*</code> (and keep{" "}
            <code className="rounded bg-bg-surface px-1">payment_link.*</code> for WhatsApp).
          </p>
          <p className="text-text-secondary">
            Tenants with a Razorpay subscription id:{" "}
            <span className="font-semibold text-text-primary">{tenantsOnRazorpay}</span>
          </p>
          <p>
            <Link href="/super-admin/tenants" className="font-semibold text-accent-primary">
              Open a tenant →
            </Link>{" "}
            to create a subscription from Super Admin.
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-extrabold text-text-primary">Feature limits by tier</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Enforced in the product by <code className="rounded bg-bg-surface px-1 text-xs">Restaurant.plan</code>.
          {razorpayLive
            ? " Prices refresh from Razorpay every few minutes (cached). Limits stay local per tier."
            : null}
        </p>
        <p className="mt-2 text-sm font-semibold text-text-primary">
          {formatPlanLabel("none")}:{" "}
          <span className="text-text-secondary">
            {unassignedCount} tenant{unassignedCount === 1 ? "" : "s"} (no tier set — not counted under Starter/Growth/Scale
            below)
          </span>
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {(Object.keys(PLAN_CATALOG) as (keyof typeof PLAN_CATALOG)[]).map((code) => {
          const p = PLAN_CATALOG[code];
          const count = planMap[code] ?? 0;
          return (
            <Card key={code} className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg capitalize">{p.name}</CardTitle>
                  <Badge>{count} tenants</Badge>
                </div>
                {razorpayLive && tierPrices ? (
                  <div className="space-y-3">
                    {(["monthly", "yearly"] as const).map((iv) => {
                      const slot = tierPrices[code][iv];
                      return (
                        <div key={iv} className="rounded-xl border border-border-subtle bg-bg-surface/80 px-3 py-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                            {iv === "monthly" ? "Monthly" : "Yearly"}
                          </p>
                          {slot.error ? (
                            <p className="mt-0.5 text-sm font-semibold text-warning">{slot.error}</p>
                          ) : (
                            <p className="mt-0.5 text-xl font-extrabold text-text-primary">
                              {slot.display ?? "—"}
                            </p>
                          )}
                          {slot.itemName ? (
                            <p className="mt-1 text-xs text-text-secondary">{slot.itemName}</p>
                          ) : null}
                        </div>
                      );
                    })}
                    {rzPlans[code].monthly || rzPlans[code].yearly ? (
                      <Badge variant="success">
                        Plan IDs:{" "}
                        {rzPlans[code].monthly && rzPlans[code].yearly
                          ? "monthly + yearly"
                          : rzPlans[code].monthly
                            ? "monthly"
                            : "yearly"}
                      </Badge>
                    ) : (
                      <Badge variant="warning">No plan ID for this tier</Badge>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-text-secondary">
                      Add <code className="rounded bg-bg-surface px-1 text-xs">RAZORPAY_KEY_*</code> and plan IDs in{" "}
                      <code className="rounded bg-bg-surface px-1 text-xs">.env</code> to load live prices. Reference
                      list pricing is not shown here.
                    </p>
                    {"note" in p && p.note ? <p className="text-xs text-text-muted">{p.note}</p> : null}
                  </div>
                )}
              </CardHeader>
              <CardContent className="text-sm text-text-secondary">
                <p className="font-semibold text-text-primary">Limits</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Outlets: {p.limits.outlets}</li>
                  <li>Registers: {p.limits.registers}</li>
                  <li>Staff seats: {p.limits.staffSeats}</li>
                  <li>WhatsApp msgs (incl. / mo): {p.limits.includedWhatsappMo.toLocaleString("en-IN")}</li>
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscription lifecycle (counts)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(bySub as any[]).map((r) => (
            <span
              key={String(r._id)}
              className="rounded-full border border-border-subtle bg-bg-surface px-3 py-1 text-sm font-semibold"
            >
              {String(r._id || "active")}: {r.n}
            </span>
          ))}
        </CardContent>
      </Card>

      <p className="text-sm text-text-muted">
        <Link href="/super-admin/tenants" className="font-semibold text-accent-primary">
          Manage tenants →
        </Link>{" "}
        to change plan or subscription status per restaurant.
      </p>
    </div>
  );
}
